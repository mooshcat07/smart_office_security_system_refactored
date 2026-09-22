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
    "http://10.163.55.232:3000/api/devices/status";

const char* FINGERPRINT_API =
    "http://10.163.55.232:3000/api/devices/fingerprint";

const char* COMMAND_API =
    "http://10.163.55.232:3000/api/devices/commands?esp32Id=ESP32-001";

const char* COMMAND_RESULT_API =
    "http://10.163.55.232:3000/api/devices/commands/result";

// =====================================================
// Device
// =====================================================

const char* ESP32_ID = "ESP32-001";
const char* FIRMWARE_VERSION = "1.0.0";

// =====================================================
// Hardware
// =====================================================

#define LED_PIN 4
#define BUZZER_PIN 21

// AS608 fingerprint sensor
#define FINGER_RX 16
#define FINGER_TX 17

HardwareSerial fingerSerial(2);

Adafruit_Fingerprint finger =
    Adafruit_Fingerprint(&fingerSerial);

// =====================================================
// Fingerprint sensor state
// =====================================================

bool fingerprintConnected = false;

uint16_t fingerprintTemplateCount = 0;

// =====================================================
// Buzzer state
// =====================================================

bool buzzerActive = false;

unsigned long buzzerStopTime = 0;

// =====================================================
// Command state
// =====================================================

unsigned long lastCommandCheck = 0;

const unsigned long COMMAND_INTERVAL = 3000;

bool enrollmentRunning = false;

// =====================================================
// Heartbeat
// =====================================================

unsigned long lastStatusTime = 0;

const unsigned long STATUS_INTERVAL = 30000;

// =====================================================
// Connect to Wi-Fi
// =====================================================

void connectWiFi() {

  Serial.println();
  Serial.println("Connecting to Wi-Fi...");

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

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
// Buzzer
// =====================================================

void triggerBuzzer(unsigned long durationMs) {

  Serial.println();
  Serial.println("================================");
  Serial.println("BUZZER TRIGGERED");
  Serial.println("================================");

  Serial.print("Duration: ");
  Serial.print(durationMs);
  Serial.println(" ms");

  digitalWrite(
    BUZZER_PIN,
    HIGH
  );

  buzzerActive = true;

  buzzerStopTime =
    millis() + durationMs;
}

// -----------------------------------------------------
// Silence buzzer
// -----------------------------------------------------

void silenceBuzzer() {

  Serial.println();
  Serial.println("================================");
  Serial.println("BUZZER SILENCED");
  Serial.println("================================");

  digitalWrite(
    BUZZER_PIN,
    LOW
  );

  buzzerActive = false;

  buzzerStopTime = 0;
}

// -----------------------------------------------------
// Update timed buzzer
// -----------------------------------------------------

void updateBuzzer() {

  if (!buzzerActive) {
    return;
  }

  if (millis() >= buzzerStopTime) {

    digitalWrite(
      BUZZER_PIN,
      LOW
    );

    buzzerActive = false;

    buzzerStopTime = 0;

    Serial.println(
      "Buzzer duration completed."
    );
  }
}

// =====================================================
// Check fingerprint sensor
// =====================================================

void checkFingerprintSensor() {

  Serial.println();
  Serial.println("Checking fingerprint sensor...");

  if (finger.verifyPassword()) {

    fingerprintConnected = true;

    Serial.println(
      "Fingerprint sensor connected!"
    );

    if (
      finger.getTemplateCount()
      == FINGERPRINT_OK
    ) {

      fingerprintTemplateCount =
        finger.templateCount;

      Serial.print(
        "Stored fingerprints: "
      );

      Serial.println(
        fingerprintTemplateCount
      );

    } else {

      Serial.println(
        "Could not read fingerprint template count."
      );
    }

  } else {

    fingerprintConnected = false;

    fingerprintTemplateCount = 0;

    Serial.println(
      "Fingerprint sensor NOT detected."
    );
  }
}

// =====================================================
// Send device heartbeat/status
// =====================================================
//
// IMPORTANT:
//
// The ESP32 does NOT send:
//   - status
//   - lastSeen
//
// The Next.js API updates lastSeen automatically
// whenever this request is received.
//
// Heartbeat is sent every 30 seconds.
//
// Server logic:
//
// Date.now() - lastSeen < 60000
//     => ONLINE
//
// Date.now() - lastSeen >= 60000
//     => OFFLINE
//
// =====================================================

void sendDeviceStatus() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "Wi-Fi disconnected. Heartbeat not sent."
    );

    return;
  }

  HTTPClient http;

  http.begin(STATUS_API);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  // Read current hardware state
  bool ledActive =
    digitalRead(LED_PIN);

  // Build JSON
  String json = "{";

  json += "\"esp32Id\":\"";
  json += ESP32_ID;
  json += "\",";

  json += "\"firmware\":\"";
  json += FIRMWARE_VERSION;
  json += "\",";

  json += "\"fingerprintConnected\":";
  json += fingerprintConnected
    ? "true"
    : "false";

  json += ",";

  json += "\"fingerprintTemplateCount\":";
  json += fingerprintTemplateCount;

  json += ",";

  json += "\"ledActive\":";
  json += ledActive
    ? "true"
    : "false";

  json += ",";

  json += "\"buzzerActive\":";
  json += buzzerActive
    ? "true"
    : "false";

  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("SENDING DEVICE HEARTBEAT");
  Serial.println("================================");

  Serial.println(json);

  int responseCode =
    http.POST(json);

  Serial.print(
    "HTTP response code: "
  );

  Serial.println(
    responseCode
  );

  String response =
    http.getString();

  Serial.println(
    "Server response:"
  );

  Serial.println(response);

  http.end();
}

// =====================================================
// Send fingerprint event
// =====================================================

void sendFingerprintEvent(
  int fingerprintId,
  const char* result
) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "Wi-Fi disconnected."
    );

    Serial.println(
      "Fingerprint event not sent."
    );

    return;
  }

  HTTPClient http;

  http.begin(FINGERPRINT_API);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

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

  int responseCode =
    http.POST(json);

  Serial.print(
    "Fingerprint API response: "
  );

  Serial.println(
    responseCode
  );

  String response =
    http.getString();

  Serial.println(
    "Server response:"
  );

  Serial.println(response);

  http.end();
}

// =====================================================
// Enroll fingerprint
// =====================================================

bool enrollFingerprint(
  uint16_t fingerprintId
) {

  Serial.println();
  Serial.println("================================");
  Serial.println("FINGERPRINT ENROLLMENT");
  Serial.println("================================");

  Serial.print(
    "Fingerprint ID: "
  );

  Serial.println(
    fingerprintId
  );

  // ---------------------------------------------------
  // First scan
  // ---------------------------------------------------

  Serial.println();
  Serial.println(
    "Place finger on sensor..."
  );

  while (true) {

    uint8_t result =
      finger.getImage();

    if (result == FINGERPRINT_OK) {

      Serial.println(
        "First fingerprint image captured."
      );

      break;
    }

    if (
      result != FINGERPRINT_NOFINGER
    ) {

      Serial.print(
        "Error capturing first fingerprint: "
      );

      Serial.println(result);

      return false;
    }

    delay(100);
  }

  // ---------------------------------------------------
  // Convert first image
  // ---------------------------------------------------

  uint8_t result =
    finger.image2Tz(1);

  if (result != FINGERPRINT_OK) {

    Serial.println(
      "Could not convert first fingerprint."
    );

    return false;
  }

  Serial.println(
    "First fingerprint converted."
  );

  // ---------------------------------------------------
  // Remove finger
  // ---------------------------------------------------

  Serial.println();
  Serial.println(
    "Remove finger..."
  );

  delay(1000);

  while (
    finger.getImage()
    != FINGERPRINT_NOFINGER
  ) {

    delay(100);
  }

  Serial.println(
    "Finger removed."
  );

  // ---------------------------------------------------
  // Second scan
  // ---------------------------------------------------

  Serial.println();
  Serial.println(
    "Place the SAME finger again..."
  );

  while (true) {

    result =
      finger.getImage();

    if (result == FINGERPRINT_OK) {

      Serial.println(
        "Second fingerprint image captured."
      );

      break;
    }

    if (
      result != FINGERPRINT_NOFINGER
    ) {

      Serial.print(
        "Error capturing second fingerprint: "
      );

      Serial.println(result);

      return false;
    }

    delay(100);
  }

  // ---------------------------------------------------
  // Convert second image
  // ---------------------------------------------------

  result =
    finger.image2Tz(2);

  if (result != FINGERPRINT_OK) {

    Serial.println(
      "Could not convert second fingerprint."
    );

    return false;
  }

  Serial.println(
    "Second fingerprint converted."
  );

  // ---------------------------------------------------
  // Create model
  // ---------------------------------------------------

  Serial.println();
  Serial.println(
    "Creating fingerprint model..."
  );

  result =
    finger.createModel();

  if (result != FINGERPRINT_OK) {

    Serial.println(
      "Fingerprints did not match."
    );

    return false;
  }

  Serial.println(
    "Fingerprint model created successfully."
  );

  // ---------------------------------------------------
  // Store model
  // ---------------------------------------------------

  Serial.print(
    "Storing fingerprint as ID "
  );

  Serial.println(
    fingerprintId
  );

  result =
    finger.storeModel(
      fingerprintId
    );

  if (result != FINGERPRINT_OK) {

    Serial.println(
      "Failed to store fingerprint."
    );

    return false;
  }

  Serial.println();
  Serial.println(
    "Fingerprint stored successfully!"
  );

  return true;
}

// =====================================================
// Delete fingerprint
// =====================================================

bool deleteFingerprint(
  uint16_t fingerprintId
) {

  Serial.println();
  Serial.println("================================");
  Serial.println("FINGERPRINT DELETION");
  Serial.println("================================");

  Serial.print(
    "Deleting fingerprint ID: "
  );

  Serial.println(
    fingerprintId
  );

  uint8_t result =
    finger.deleteModel(
      fingerprintId
    );

  if (result == FINGERPRINT_OK) {

    Serial.println(
      "Fingerprint deleted successfully."
    );

    return true;
  }

  Serial.print(
    "Failed to delete fingerprint."
  );

  Serial.print(
    " Error code: "
  );

  Serial.println(
    result
  );

  return false;
}

// =====================================================
// Send command result
// =====================================================

void sendCommandResult(
  const char* commandId,
  bool success,
  const char* failureReason = nullptr
) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "Wi-Fi disconnected."
    );

    Serial.println(
      "Command result not sent."
    );

    return;
  }

  HTTPClient http;

  http.begin(
    COMMAND_RESULT_API
  );

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  String json = "{";

  json += "\"commandId\":\"";
  json += commandId;
  json += "\",";

  json += "\"success\":";
  json += success
    ? "true"
    : "false";

  if (
    !success &&
    failureReason != nullptr
  ) {

    json += ",";

    json += "\"failureReason\":\"";
    json += failureReason;
    json += "\"";
  }

  json += "}";

  Serial.println();
  Serial.println("================================");
  Serial.println("SENDING COMMAND RESULT");
  Serial.println("================================");

  Serial.println(json);

  int responseCode =
    http.POST(json);

  Serial.print(
    "Command result response: "
  );

  Serial.println(
    responseCode
  );

  String response =
    http.getString();

  Serial.println(
    "Server response:"
  );

  Serial.println(response);

  http.end();
}

// =====================================================
// Check for pending commands
// =====================================================

void checkForCommands() {

  // Don't process commands while enrolling
  if (enrollmentRunning) {
    return;
  }

  // Need Wi-Fi
  if (
    WiFi.status() != WL_CONNECTED
  ) {
    return;
  }

  HTTPClient http;

  http.begin(
    COMMAND_API
  );

  int responseCode =
    http.GET();

  Serial.print(
    "Command API response: "
  );

  Serial.println(
    responseCode
  );

  if (responseCode != 200) {

    http.end();

    return;
  }

  String response =
    http.getString();

  http.end();

  // ---------------------------------------------------
  // Parse JSON
  // ---------------------------------------------------

  JsonDocument doc;

  DeserializationError error =
    deserializeJson(
      doc,
      response
    );

  if (error) {

    Serial.print(
      "Command JSON parsing failed: "
    );

    Serial.println(
      error.c_str()
    );

    return;
  }

  // ---------------------------------------------------
  // Check command
  // ---------------------------------------------------

  if (
    doc["command"].isNull() ||
    doc["command"]["commandId"].isNull()
  ) {

    return;
  }

  // ---------------------------------------------------
  // Read command
  // ---------------------------------------------------

  const char* command =
    doc["command"]["command"];

  const char* commandId =
    doc["command"]["commandId"];

  int fingerprintId =
    doc["command"]["fingerprintId"] | 0;

  unsigned long durationMs =
    doc["command"]["durationMs"] | 2000;

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

  // ===================================================
  // TRIGGER BUZZER
  // ===================================================

  if (
    strcmp(
      command,
      "TRIGGER_BUZZER"
    ) == 0
  ) {

    if (durationMs == 0) {
      durationMs = 2000;
    }

    triggerBuzzer(
      durationMs
    );

    sendCommandResult(
      commandId,
      true
    );

    // This also updates lastSeen
    sendDeviceStatus();

    return;
  }

  // ===================================================
  // SILENCE BUZZER
  // ===================================================

  else if (
    strcmp(
      command,
      "SILENCE_BUZZER"
    ) == 0
  ) {

    silenceBuzzer();

    sendCommandResult(
      commandId,
      true
    );

    // This also updates lastSeen
    sendDeviceStatus();

    return;
  }

  // ===================================================
  // ENROLL FINGERPRINT
  // ===================================================

  else if (
    strcmp(
      command,
      "ENROLL_FINGERPRINT"
    ) == 0
  ) {

    if (
      fingerprintId < 1 ||
      fingerprintId > 127
    ) {

      Serial.println(
        "Invalid fingerprint ID."
      );

      sendCommandResult(
        commandId,
        false,
        "Fingerprint ID must be between 1 and 127"
      );

      return;
    }

    enrollmentRunning = true;

    bool enrolled =
      enrollFingerprint(
        fingerprintId
      );

    enrollmentRunning = false;

    if (enrolled) {

      Serial.println();
      Serial.println(
        "Enrollment completed successfully."
      );

      // Update local template count
      if (
        finger.getTemplateCount()
        == FINGERPRINT_OK
      ) {

        fingerprintTemplateCount =
          finger.templateCount;
      }

      // Tell server enrollment succeeded
      sendCommandResult(
        commandId,
        true
      );

      // Update server heartbeat
      sendDeviceStatus();

    } else {

      Serial.println();
      Serial.println(
        "Enrollment failed."
      );

      sendCommandResult(
        commandId,
        false,
        "AS608 fingerprint enrollment failed"
      );
    }

    return;
  }

  // ===================================================
  // DELETE FINGERPRINT
  // ===================================================

  else if (
    strcmp(
      command,
      "DELETE_FINGERPRINT"
    ) == 0
  ) {

    if (
      fingerprintId < 1 ||
      fingerprintId > 127
    ) {

      Serial.println(
        "Invalid fingerprint ID."
      );

      sendCommandResult(
        commandId,
        false,
        "Fingerprint ID must be between 1 and 127"
      );

      return;
    }

    bool deleted =
      deleteFingerprint(
        fingerprintId
      );

    if (deleted) {

      // Update local template count
      if (
        finger.getTemplateCount()
        == FINGERPRINT_OK
      ) {

        fingerprintTemplateCount =
          finger.templateCount;
      }

      Serial.println();
      Serial.println(
        "Deletion completed successfully."
      );

      sendCommandResult(
        commandId,
        true
      );

      // Update server heartbeat
      sendDeviceStatus();

    } else {

      Serial.println();
      Serial.println(
        "Fingerprint deletion failed."
      );

      sendCommandResult(
        commandId,
        false,
        "Failed to delete fingerprint from sensor"
      );
    }

    return;
  }

  // ===================================================
  // Unknown command
  // ===================================================

  Serial.println(
    "Unknown device command."
  );

  sendCommandResult(
    commandId,
    false,
    "Unknown device command"
  );
}

// =====================================================
// Scan fingerprint
// =====================================================

void scanFingerprint() {

  // Don't scan while enrollment is happening
  if (enrollmentRunning) {
    return;
  }

  // Don't scan if sensor isn't connected
  if (!fingerprintConnected) {
    return;
  }

  // ---------------------------------------------------
  // Capture image
  // ---------------------------------------------------

  uint8_t result =
    finger.getImage();

  if (
    result == FINGERPRINT_NOFINGER
  ) {
    return;
  }

  if (
    result != FINGERPRINT_OK
  ) {

    Serial.println(
      "Could not capture fingerprint image."
    );

    return;
  }

  Serial.println();
  Serial.println(
    "Fingerprint image captured."
  );

  // ---------------------------------------------------
  // Convert image
  // ---------------------------------------------------

  result =
    finger.image2Tz();

  if (
    result != FINGERPRINT_OK
  ) {

    Serial.println(
      "Could not convert fingerprint."
    );

    sendFingerprintEvent(
      0,
      "DENIED"
    );

    return;
  }

  // ---------------------------------------------------
  // Search database
  // ---------------------------------------------------

  result =
    finger.fingerSearch();

  if (
    result == FINGERPRINT_OK
  ) {

    Serial.println(
      "Fingerprint recognized!"
    );

    Serial.print(
      "Fingerprint ID: "
    );

    Serial.println(
      finger.fingerID
    );

    Serial.print(
      "Confidence: "
    );

    Serial.println(
      finger.confidence
    );

    // -------------------------------------------------
    // GRANTED
    // -------------------------------------------------

    sendFingerprintEvent(
      finger.fingerID,
      "GRANTED"
    );

    // Turn LED on
    digitalWrite(
      LED_PIN,
      HIGH
    );

    delay(2000);

    // Turn LED off
    digitalWrite(
      LED_PIN,
      LOW
    );

  } else {

    // -------------------------------------------------
    // DENIED
    // -------------------------------------------------

    Serial.println(
      "Fingerprint NOT recognized."
    );

    sendFingerprintEvent(
      0,
      "DENIED"
    );

    // Activate buzzer
    triggerBuzzer(
      1000
    );
  }

  // ---------------------------------------------------
  // Wait for finger removal
  // ---------------------------------------------------

  while (
    finger.getImage()
    != FINGERPRINT_NOFINGER
  ) {

    delay(100);
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(
    115200
  );

  delay(1000);

  // ===================================================
  // LED
  // ===================================================

  pinMode(
    LED_PIN,
    OUTPUT
  );

  digitalWrite(
    LED_PIN,
    LOW
  );

  // ===================================================
  // Buzzer
  // ===================================================

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  digitalWrite(
    BUZZER_PIN,
    LOW
  );

  // ===================================================
  // AS608
  // ===================================================

  fingerSerial.begin(
    57600,
    SERIAL_8N1,
    FINGER_RX,
    FINGER_TX
  );

  // ===================================================
  // Startup message
  // ===================================================

  Serial.println();
  Serial.println("==============================");
  Serial.println(" Smart Office Security System");
  Serial.println("==============================");

  Serial.print("ESP32 ID: ");
  Serial.println(ESP32_ID);

  Serial.print("Firmware: ");
  Serial.println(FIRMWARE_VERSION);

  // ===================================================
  // Wi-Fi
  // ===================================================

  connectWiFi();

  // ===================================================
  // Fingerprint sensor
  // ===================================================

  checkFingerprintSensor();

  // ===================================================
  // Initial heartbeat
  // ===================================================
  //
  // This creates/updates lastSeen on the server.
  //
  // The ESP32 does NOT send status or lastSeen.
  //
  // ===================================================

  sendDeviceStatus();

  lastStatusTime =
    millis();
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // ===================================================
  // Update buzzer
  // ===================================================

  updateBuzzer();

  // ===================================================
  // Check pending commands every 3 seconds
  // ===================================================

  if (
    millis() - lastCommandCheck
    >= COMMAND_INTERVAL
  ) {

    lastCommandCheck =
      millis();

    checkForCommands();
  }

  // ===================================================
  // Scan fingerprint
  // ===================================================

  scanFingerprint();

  // ===================================================
  // Heartbeat every 30 seconds
  // ===================================================
  //
  // Every 30 seconds:
  //
  // 1. Check AS608
  // 2. Send current hardware information
  // 3. Server updates lastSeen
  //
  // ===================================================

  if (
    millis() - lastStatusTime
    >= STATUS_INTERVAL
  ) {

    lastStatusTime =
      millis();

    checkFingerprintSensor();

    sendDeviceStatus();
  }

  delay(100);
}
