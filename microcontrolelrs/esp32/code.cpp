#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <Adafruit_Fingerprint.h>
#include <ArduinoJson.h>

// =====================================================
// Wi-Fi
// =====================================================

const char* WIFI_SSID = "Grimm";
const char* WIFI_PASSWORD = "MooshMoosh07";

// =====================================================
// Next.js API
// =====================================================

const char* STATUS_API =
    "http://10.140.2.232:3000/api/devices/status";

const char* FINGERPRINT_API =
    "http://10.140.2.232:3000/api/devices/fingerprint";

const char* COMMAND_API =
    "http://10.140.2.232:3000/api/devices/commands?esp32Id=ESP32-001";

const char* COMMAND_RESULT_API =
    "http://10.140.2.232:3000/api/devices/commands/result";

const char* MOTION_API =
    "http://10.140.2.232:3000/api/devices/motion";

// =====================================================
// Device
// =====================================================

const char* ESP32_ID = "ESP32-001";
const char* FIRMWARE_VERSION = "1.0.2";

// =====================================================
// Hardware
// =====================================================

#define LED_PIN 4        // green LED: access granted
#define RED_LED_PIN 18   // red LED: fingerprint failed
#define BUZZER_PIN 21

// HC-SR501 PIR motion sensor
// Pinout (facing the pins): GND | OUT | VCC
// Wiring: GND -> GND, VCC -> VIN (5V), OUT -> GPIO 26
#define PIR_PIN 26

// AS608 fingerprint sensor
#define FINGER_RX 16
#define FINGER_TX 17

HardwareSerial fingerSerial(2);

Adafruit_Fingerprint finger =
    Adafruit_Fingerprint(&fingerSerial);

// =====================================================
// Timing (feedback + polling)
// =====================================================

const unsigned long LED_FEEDBACK_MS = 2000;      // green / red LED — longer so scan is easier to see
const unsigned long BUZZER_FEEDBACK_MS = 1000;   // short deny pulse
const unsigned long MOTION_ALARM_BUZZER_MS = 1000;
const unsigned long COMMAND_INTERVAL = 3000;
const unsigned long STATUS_INTERVAL = 30000;
const unsigned long MOTION_COOLDOWN_MS = 10000;
const unsigned long LOOP_IDLE_MS = 20;
const unsigned long SENSOR_RECHECK_EVERY_N = 5;  // re-verify AS608 every N heartbeats

// HC-SR501 needs ~30–60 s after power-on to stabilise (false triggers while warming).
// We wait this long, then until OUT goes LOW (settled), before trusting PIR / sending heartbeat.
const unsigned long PIR_WARMUP_MS = 30000;
const unsigned long PIR_SETTLE_TIMEOUT_MS = 15000;  // max extra wait for LOW after warm-up

// =====================================================
// Fingerprint sensor state
// =====================================================

bool fingerprintConnected = false;
uint16_t fingerprintTemplateCount = 0;
uint8_t statusCycleCount = 0;

// =====================================================
// Buzzer state (non-blocking)
// =====================================================

bool buzzerActive = false;
unsigned long buzzerStopTime = 0;

// =====================================================
// LED state (non-blocking — same idea as buzzer)
// =====================================================

bool greenLedActive = false;
unsigned long greenLedStopTime = 0;

bool redLedActive = false;
unsigned long redLedStopTime = 0;

// =====================================================
// Command / heartbeat / PIR state
// =====================================================

unsigned long lastCommandCheck = 0;
bool enrollmentRunning = false;

unsigned long lastStatusTime = 0;

bool lastPirState = false;
unsigned long lastMotionReport = 0;
bool pirReady = false;  // false until warm-up + settle complete

// =====================================================
// Helpers: non-blocking outputs
// =====================================================

void triggerBuzzer(unsigned long durationMs) {
  Serial.println();
  Serial.println("================================");
  Serial.println("BUZZER TRIGGERED");
  Serial.println("================================");
  Serial.print("Duration: ");
  Serial.print(durationMs);
  Serial.println(" ms");

  digitalWrite(BUZZER_PIN, HIGH);
  buzzerActive = true;
  buzzerStopTime = millis() + durationMs;
}

void silenceBuzzer() {
  Serial.println();
  Serial.println("================================");
  Serial.println("BUZZER SILENCED");
  Serial.println("================================");

  digitalWrite(BUZZER_PIN, LOW);
  buzzerActive = false;
  buzzerStopTime = 0;
}

void updateBuzzer() {
  if (!buzzerActive) return;
  if (millis() >= buzzerStopTime) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
    buzzerStopTime = 0;
    Serial.println("Buzzer duration completed.");
  }
}

void triggerGreenLED(unsigned long durationMs = LED_FEEDBACK_MS) {
  digitalWrite(LED_PIN, HIGH);
  greenLedActive = true;
  greenLedStopTime = millis() + durationMs;
}

void triggerRedLED(unsigned long durationMs = LED_FEEDBACK_MS) {
  digitalWrite(RED_LED_PIN, HIGH);
  redLedActive = true;
  redLedStopTime = millis() + durationMs;
}

void updateLEDs() {
  if (greenLedActive && millis() >= greenLedStopTime) {
    digitalWrite(LED_PIN, LOW);
    greenLedActive = false;
    greenLedStopTime = 0;
  }
  if (redLedActive && millis() >= redLedStopTime) {
    digitalWrite(RED_LED_PIN, LOW);
    redLedActive = false;
    redLedStopTime = 0;
  }
}

// Call once per loop — keeps all timed outputs honest
void updateOutputs() {
  updateBuzzer();
  updateLEDs();
}

// =====================================================
// PIR motion
// =====================================================

void reportMotion() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Motion: Wi-Fi not connected, skip report");
    return;
  }

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(MOTION_API);
  http.addHeader("Content-Type", "application/json");

  String body = String("{\"esp32Id\":\"") + ESP32_ID + "\"}";

  Serial.println();
  Serial.println("================================");
  Serial.println("PIR MOTION DETECTED — reporting");
  Serial.println("================================");

  int code = http.POST(body);

  if (code > 0) {
    String response = http.getString();
    Serial.print("Motion API response (");
    Serial.print(code);
    Serial.print("): ");
    Serial.println(response);

    if (response.indexOf("\"triggerBuzzer\":true") >= 0 ||
        response.indexOf("\"afterHours\":true") >= 0) {
      Serial.println("AFTER HOURS → stored + sounding buzzer");
      triggerBuzzer(MOTION_ALARM_BUZZER_MS);
    } else if (response.indexOf("\"recorded\":false") >= 0) {
      Serial.println("Working hours → motion ignored (not stored)");
    }
  } else {
    Serial.print("Motion API failed, HTTP code: ");
    Serial.println(code);
  }

  http.end();
}

void checkPIR() {
  if (!pirReady) {
    return;  // still warming up / settling — ignore edges
  }

  bool current = digitalRead(PIR_PIN) == HIGH;

  // Rising edge = new motion detection
  if (current && !lastPirState) {
    unsigned long now = millis();
    if (now - lastMotionReport >= MOTION_COOLDOWN_MS) {
      lastMotionReport = now;
      reportMotion();
    } else {
      Serial.println("PIR rising edge ignored (cooldown)");
    }
  }

  lastPirState = current;
}

// =====================================================
// Wi-Fi
// =====================================================

void connectWiFi() {
  Serial.println();
  Serial.println("Connecting to Wi-Fi...");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi connected!");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

// =====================================================
// Fingerprint sensor check
// =====================================================

void checkFingerprintSensor() {
  Serial.println();
  Serial.println("Checking fingerprint sensor...");

  if (finger.verifyPassword()) {
    fingerprintConnected = true;
    Serial.println("Fingerprint sensor connected!");

    if (finger.getTemplateCount() == FINGERPRINT_OK) {
      fingerprintTemplateCount = finger.templateCount;
      Serial.print("Stored fingerprints: ");
      Serial.println(fingerprintTemplateCount);
    } else {
      Serial.println("Could not read fingerprint template count.");
    }
  } else {
    fingerprintConnected = false;
    fingerprintTemplateCount = 0;
    Serial.println("Fingerprint sensor NOT detected.");
  }
}

// =====================================================
// Heartbeat
// =====================================================

void sendDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Heartbeat not sent.");
    return;
  }

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(STATUS_API);
  http.addHeader("Content-Type", "application/json");

  bool ledActive = digitalRead(LED_PIN) == HIGH;

  String json = "{";
  json += "\"esp32Id\":\"";
  json += ESP32_ID;
  json += "\",";
  json += "\"firmware\":\"";
  json += FIRMWARE_VERSION;
  json += "\",";
  json += "\"fingerprintConnected\":";
  json += fingerprintConnected ? "true" : "false";
  json += ",";
  json += "\"fingerprintTemplateCount\":";
  json += fingerprintTemplateCount;
  json += ",";
  json += "\"ledActive\":";
  json += ledActive ? "true" : "false";
  json += ",";
  json += "\"buzzerActive\":";
  json += buzzerActive ? "true" : "false";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("SENDING DEVICE HEARTBEAT");
  Serial.println("================================");
  Serial.println(json);

  int responseCode = http.POST(json);
  Serial.print("HTTP response code: ");
  Serial.println(responseCode);
  Serial.println(http.getString());
  http.end();
}

// =====================================================
// Fingerprint event → server
// =====================================================

bool sendFingerprintEvent(int fingerprintId, const char* result) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Fingerprint event not sent.");
    return false;
  }

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(FINGERPRINT_API);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"esp32Id\":\"";
  json += ESP32_ID;
  json += "\",";
  json += "\"fingerprintId\":";
  json += fingerprintId;
  json += ",";
  json += "\"result\":\"";
  json += result;
  json += "\"";
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("SENDING FINGERPRINT EVENT");
  Serial.println("================================");
  Serial.println(json);

  int responseCode = http.POST(json);
  Serial.print("Fingerprint API response: ");
  Serial.println(responseCode);

  String response = http.getString();
  Serial.println(response);
  http.end();

  if (responseCode != 200) {
    return false;
  }

  JsonDocument responseDoc;
  if (deserializeJson(responseDoc, response)) {
    return false;
  }

  const char* serverStatus = responseDoc["status"] | "DENIED";
  const char* direction = responseDoc["direction"] | "";
  if (strlen(direction) > 0) {
    Serial.print("Direction: ");
    Serial.println(direction);
  }

  return strcmp(serverStatus, "GRANTED") == 0;
}

// =====================================================
// Enroll / delete (blocking by nature of sensor UX)
// =====================================================

bool enrollFingerprint(uint16_t fingerprintId) {
  Serial.println();
  Serial.println("================================");
  Serial.println("FINGERPRINT ENROLLMENT");
  Serial.println("================================");
  Serial.print("Fingerprint ID: ");
  Serial.println(fingerprintId);

  Serial.println();
  Serial.println("Place finger on sensor...");

  while (true) {
    updateOutputs();  // keep buzzer/LEDs alive during wait
    uint8_t result = finger.getImage();
    if (result == FINGERPRINT_OK) {
      Serial.println("First fingerprint image captured.");
      break;
    }
    if (result != FINGERPRINT_NOFINGER) {
      Serial.print("Error capturing first fingerprint: ");
      Serial.println(result);
      return false;
    }
    delay(50);
  }

  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    Serial.println("Could not convert first fingerprint.");
    return false;
  }
  Serial.println("First fingerprint converted.");

  Serial.println();
  Serial.println("Remove finger...");
  delay(500);
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    updateOutputs();
    delay(50);
  }
  Serial.println("Finger removed.");

  Serial.println();
  Serial.println("Place the SAME finger again...");

  while (true) {
    updateOutputs();
    uint8_t result = finger.getImage();
    if (result == FINGERPRINT_OK) {
      Serial.println("Second fingerprint image captured.");
      break;
    }
    if (result != FINGERPRINT_NOFINGER) {
      Serial.print("Error capturing second fingerprint: ");
      Serial.println(result);
      return false;
    }
    delay(50);
  }

  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    Serial.println("Could not convert second fingerprint.");
    return false;
  }
  Serial.println("Second fingerprint converted.");

  Serial.println();
  Serial.println("Creating fingerprint model...");
  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("Fingerprints did not match.");
    return false;
  }
  Serial.println("Fingerprint model created successfully.");

  Serial.print("Storing fingerprint as ID ");
  Serial.println(fingerprintId);

  if (finger.storeModel(fingerprintId) != FINGERPRINT_OK) {
    Serial.println("Failed to store fingerprint.");
    return false;
  }

  Serial.println();
  Serial.println("Fingerprint stored successfully!");
  return true;
}

bool deleteFingerprint(uint16_t fingerprintId) {
  Serial.println();
  Serial.println("================================");
  Serial.println("FINGERPRINT DELETION");
  Serial.println("================================");
  Serial.print("Deleting fingerprint ID: ");
  Serial.println(fingerprintId);

  uint8_t result = finger.deleteModel(fingerprintId);
  if (result == FINGERPRINT_OK) {
    Serial.println("Fingerprint deleted successfully.");
    return true;
  }

  Serial.print("Failed to delete fingerprint. Error code: ");
  Serial.println(result);
  return false;
}

// =====================================================
// Command result + pending commands
// =====================================================

void sendCommandResult(
  const char* commandId,
  bool success,
  const char* failureReason = nullptr
) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Command result not sent.");
    return;
  }

  HTTPClient http;
  http.setTimeout(4000);
  http.begin(COMMAND_RESULT_API);
  http.addHeader("Content-Type", "application/json");

  String json = "{";
  json += "\"commandId\":\"";
  json += commandId;
  json += "\",";
  json += "\"success\":";
  json += success ? "true" : "false";

  if (!success && failureReason != nullptr) {
    json += ",\"failureReason\":\"";
    json += failureReason;
    json += "\"";
  }
  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("SENDING COMMAND RESULT");
  Serial.println("================================");
  Serial.println(json);

  int responseCode = http.POST(json);
  Serial.print("Command result response: ");
  Serial.println(responseCode);
  Serial.println(http.getString());
  http.end();
}

void checkForCommands() {
  if (enrollmentRunning) return;
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.setTimeout(5000);
  http.begin(COMMAND_API);

  int responseCode = http.GET();

  // -11 = HTTPC_ERROR_READ_TIMEOUT — often Wi-Fi blip or server busy.
  // Not fatal; we try again on the next 3 s poll.
  if (responseCode <= 0) {
    Serial.print("Command poll failed (HTTP ");
    Serial.print(responseCode);
    Serial.println(") — will retry");
    http.end();
    return;
  }

  if (responseCode != 200) {
    Serial.print("Command API unexpected status: ");
    Serial.println(responseCode);
    http.end();
    return;
  }

  String response = http.getString();
  http.end();

  // No pending command → stay quiet (avoid Serial spam every 3 s)
  if (response.indexOf(""command":null") >= 0 ||
      response.indexOf(""command": null") >= 0) {
    return;
  }

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, response);
  if (error) {
    Serial.print("Command JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }

  if (doc["command"].isNull() || doc["command"]["commandId"].isNull()) {
    return;
  }

  const char* command = doc["command"]["command"];
  const char* commandId = doc["command"]["commandId"];
  int fingerprintId = doc["command"]["fingerprintId"] | 0;
  unsigned long durationMs = doc["command"]["durationMs"] | BUZZER_FEEDBACK_MS;

  Serial.println();
  Serial.println("================================");
  Serial.println("PENDING DEVICE COMMAND");
  Serial.println("================================");
  Serial.print("Command: ");
  Serial.println(command);
  Serial.print("Command ID: ");
  Serial.println(commandId);
  Serial.print("Fingerprint ID: ");
  Serial.println(fingerprintId);
  Serial.print("Duration: ");
  Serial.print(durationMs);
  Serial.println(" ms");

  if (strcmp(command, "TRIGGER_BUZZER") == 0) {
    if (durationMs == 0) durationMs = BUZZER_FEEDBACK_MS;
    triggerBuzzer(durationMs);
    sendCommandResult(commandId, true);
    sendDeviceStatus();
    return;
  }

  if (strcmp(command, "SILENCE_BUZZER") == 0) {
    silenceBuzzer();
    sendCommandResult(commandId, true);
    sendDeviceStatus();
    return;
  }

  if (strcmp(command, "ENROLL_FINGERPRINT") == 0) {
    if (fingerprintId < 1 || fingerprintId > 127) {
      sendCommandResult(
        commandId,
        false,
        "Fingerprint ID must be between 1 and 127"
      );
      return;
    }

    enrollmentRunning = true;
    bool enrolled = enrollFingerprint(fingerprintId);
    enrollmentRunning = false;

    if (enrolled) {
      if (finger.getTemplateCount() == FINGERPRINT_OK) {
        fingerprintTemplateCount = finger.templateCount;
      }
      sendCommandResult(commandId, true);
      sendDeviceStatus();
    } else {
      sendCommandResult(
        commandId,
        false,
        "AS608 fingerprint enrollment failed"
      );
    }
    return;
  }

  if (strcmp(command, "DELETE_FINGERPRINT") == 0) {
    if (fingerprintId < 1 || fingerprintId > 127) {
      sendCommandResult(
        commandId,
        false,
        "Fingerprint ID must be between 1 and 127"
      );
      return;
    }

    bool deleted = deleteFingerprint(fingerprintId);
    if (deleted) {
      if (finger.getTemplateCount() == FINGERPRINT_OK) {
        fingerprintTemplateCount = finger.templateCount;
      }
      sendCommandResult(commandId, true);
      sendDeviceStatus();
    } else {
      sendCommandResult(
        commandId,
        false,
        "Failed to delete fingerprint from sensor"
      );
    }
    return;
  }

  Serial.println("Unknown device command.");
  sendCommandResult(commandId, false, "Unknown device command");
}

// =====================================================
// Scan fingerprint (non-blocking LED/buzzer feedback)
// =====================================================

void scanFingerprint() {
  if (enrollmentRunning) return;
  if (!fingerprintConnected) return;

  uint8_t result = finger.getImage();

  if (result == FINGERPRINT_NOFINGER) {
    return;
  }

  // Transient AS608 codes (partial finger, bad image, packet glitch)
  // are normal while scanning — do not spam Serial.
  if (result != FINGERPRINT_OK) {
    return;
  }

  Serial.println();
  Serial.println("Fingerprint image captured.");

  result = finger.image2Tz();
  if (result != FINGERPRINT_OK) {
    Serial.println("Could not convert fingerprint.");
    sendFingerprintEvent(0, "DENIED");
    triggerBuzzer(BUZZER_FEEDBACK_MS);
    triggerRedLED();
    return;
  }

  result = finger.fingerSearch();

  if (result == FINGERPRINT_OK) {
    Serial.println("Fingerprint recognized!");
    Serial.print("Fingerprint ID: ");
    Serial.println(finger.fingerID);
    Serial.print("Confidence: ");
    Serial.println(finger.confidence);

    bool granted = sendFingerprintEvent(finger.fingerID, "GRANTED");

    if (granted) {
      // Non-blocking green LED — loop keeps running (PIR, buzzer, etc.)
      triggerGreenLED(LED_FEEDBACK_MS);
    } else {
      Serial.println("Access denied by server.");
      triggerBuzzer(BUZZER_FEEDBACK_MS);
      triggerRedLED();
    }
  } else {
    Serial.println("Fingerprint NOT recognized.");
    sendFingerprintEvent(0, "DENIED");
    triggerBuzzer(BUZZER_FEEDBACK_MS);
    triggerRedLED();
  }

  // Wait for finger removal without freezing outputs for long stretches
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    updateOutputs();
    delay(30);
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  pinMode(RED_LED_PIN, OUTPUT);
  digitalWrite(RED_LED_PIN, LOW);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  pinMode(PIR_PIN, INPUT);
  lastPirState = digitalRead(PIR_PIN) == HIGH;
  pirReady = false;

  fingerSerial.begin(57600, SERIAL_8N1, FINGER_RX, FINGER_TX);

  Serial.println();
  Serial.println("==============================");
  Serial.println(" Smart Office Security System");
  Serial.println("==============================");
  Serial.print("ESP32 ID: ");
  Serial.println(ESP32_ID);
  Serial.print("Firmware: ");
  Serial.println(FIRMWARE_VERSION);

  // -------------------------------------------------
  // 1) ESP + Wi-Fi
  // -------------------------------------------------
  Serial.println();
  Serial.println("[SELF-TEST] ESP32 starting...");
  connectWiFi();
  Serial.println("[SELF-TEST] ESP32 + Wi-Fi: OK");

  // -------------------------------------------------
  // 2) Fingerprint (AS608)
  // -------------------------------------------------
  Serial.println();
  Serial.println("[SELF-TEST] Checking fingerprint sensor...");
  checkFingerprintSensor();
  if (fingerprintConnected) {
    Serial.println("[SELF-TEST] Fingerprint sensor: OK (connected)");
  } else {
    Serial.println("[SELF-TEST] Fingerprint sensor: NOT detected (will keep trying later)");
  }

  // -------------------------------------------------
  // 3) Buzzer / LEDs — quick hardware tick (non-blocking timers)
  // -------------------------------------------------
  Serial.println();
  Serial.println("[SELF-TEST] Buzzer + LEDs pulse...");
  triggerBuzzer(150);
  triggerGreenLED(200);
  triggerRedLED(200);
  unsigned long pulseEnd = millis() + 250;
  while (millis() < pulseEnd) {
    updateOutputs();
    delay(10);
  }
  silenceBuzzer();
  digitalWrite(LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  greenLedActive = false;
  redLedActive = false;
  Serial.println("[SELF-TEST] Buzzer + LEDs: OK");

  // -------------------------------------------------
  // 4) PIR warm-up (HC-SR501 needs ~30 s after power)
  //    Do NOT send heartbeat or trust motion until settled.
  // -------------------------------------------------
  Serial.println();
  Serial.println("[SELF-TEST] PIR warm-up starting...");
  Serial.print("  Waiting ");
  Serial.print(PIR_WARMUP_MS / 1000);
  Serial.println(" s for sensor to stabilise (ignore false triggers).");

  unsigned long warmStart = millis();
  unsigned long lastPrint = 0;
  while (millis() - warmStart < PIR_WARMUP_MS) {
    updateOutputs();
    // Progress every 5 s
    if (millis() - lastPrint >= 5000) {
      lastPrint = millis();
      unsigned long left = (PIR_WARMUP_MS - (millis() - warmStart) + 999) / 1000;
      Serial.print("  PIR warm-up... ");
      Serial.print(left);
      Serial.println(" s left");
    }
    delay(50);
  }

  Serial.println("  Warm-up time done. Waiting for PIR OUT to go LOW (settled)...");

  unsigned long settleStart = millis();
  bool settled = false;
  while (millis() - settleStart < PIR_SETTLE_TIMEOUT_MS) {
    updateOutputs();
    if (digitalRead(PIR_PIN) == LOW) {
      settled = true;
      break;
    }
    delay(50);
  }

  if (settled) {
    Serial.println("[SELF-TEST] PIR sensor: OK (settled / ready)");
  } else {
    // Still HIGH after timeout — start anyway but log warning
    Serial.println("[SELF-TEST] PIR sensor: still HIGH after settle window — starting anyway");
  }

  lastPirState = digitalRead(PIR_PIN) == HIGH;
  pirReady = true;
  lastMotionReport = millis();  // avoid immediate false report after enable

  // -------------------------------------------------
  // 5) First heartbeat — only after self-test
  // -------------------------------------------------
  Serial.println();
  Serial.println("[SELF-TEST] All checks finished → sending first heartbeat");
  sendDeviceStatus();

  lastStatusTime = millis();
  lastCommandCheck = millis();

  Serial.println();
  Serial.println("==============================");
  Serial.println(" System ready — entering loop");
  Serial.println("==============================");
}

// =====================================================
// LOOP — keep this tight; no long delay() calls here
// =====================================================

void loop() {
  // 1. Timed outputs first (buzzer + LEDs)
  updateOutputs();

  // 2. Commands (every 3 s)
  if (millis() - lastCommandCheck >= COMMAND_INTERVAL) {
    lastCommandCheck = millis();
    checkForCommands();
  }

  // 3. Fingerprint scan (returns immediately if no finger)
  scanFingerprint();

  // 4. PIR (instant GPIO read; HTTP only on rising edge + cooldown)
  checkPIR();

  // 5. Heartbeat (every 30 s). Re-check AS608 only every N cycles
  //    so we don't block on verifyPassword every time.
  if (millis() - lastStatusTime >= STATUS_INTERVAL) {
    lastStatusTime = millis();
    statusCycleCount++;
    if (statusCycleCount >= SENSOR_RECHECK_EVERY_N) {
      statusCycleCount = 0;
      checkFingerprintSensor();
    }
    sendDeviceStatus();
  }

  delay(LOOP_IDLE_MS);
}
