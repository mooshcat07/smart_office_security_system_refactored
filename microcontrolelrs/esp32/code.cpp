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

const char* DOMAIN =
    "http://10.163.55.232:3000/api";

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

// AS608
#define FINGER_RX 16
#define FINGER_TX 17

HardwareSerial fingerSerial(2);

Adafruit_Fingerprint finger =
    Adafruit_Fingerprint(&fingerSerial);

// =====================================================
// Device component status
// =====================================================

bool fingerprintConnected = false;

uint16_t fingerprintTemplateCount = 0;

// =====================================================
// Command state
// =====================================================

unsigned long lastCommandCheck = 0;

const unsigned long COMMAND_INTERVAL = 3000;

bool enrollmentRunning = false;

// =====================================================
// Wi-Fi
// =====================================================

void connectWiFi() {

  Serial.print("Connecting to Wi-Fi");

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
// Check AS608
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
// Send device status
// =====================================================

void sendDeviceStatus() {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println(
      "Wi-Fi disconnected."
    );

    return;
  }

  HTTPClient http;

  http.begin(STATUS_API);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  bool buzzerActive =
    digitalRead(BUZZER_PIN);

  bool ledActive =
    digitalRead(LED_PIN);

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
  Serial.println(
    "Sending device status:"
  );

  Serial.println(json);

  int responseCode =
    http.POST(json);

  Serial.print(
    "HTTP response code: "
  );

  Serial.println(responseCode);

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
      "Wi-Fi disconnected. Fingerprint event not sent."
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
  Serial.println(
    "Sending fingerprint event:"
  );

  Serial.println(json);

  int responseCode =
    http.POST(json);

  Serial.print(
    "Fingerprint API response: "
  );

  Serial.println(responseCode);

  String response =
    http.getString();

  Serial.println(
    "Server response:"
  );

  Serial.println(response);

  http.end();
}

// =====================================================
// Enroll fingerprint on AS608
// =====================================================

bool enrollFingerprint(
  uint16_t fingerprintId
) {

  Serial.println();
  Serial.println(
    "================================"
  );

  Serial.println(
    "FINGERPRINT ENROLLMENT"
  );

  Serial.println(
    "================================"
  );

  Serial.print(
    "Fingerprint ID: "
  );

  Serial.println(
    fingerprintId
  );

  // ---------------------------------------------------
  // First finger scan
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
  // Second finger scan
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
  // Create fingerprint model
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
  // Store fingerprint
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
// Delete fingerprint from AS608
// =====================================================

bool deleteFingerprint(
  uint16_t fingerprintId
) {

  Serial.println();

  Serial.println(
    "================================"
  );

  Serial.println(
    "FINGERPRINT DELETION"
  );

  Serial.println(
    "================================"
  );

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

  Serial.println(result);

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
      "Wi-Fi disconnected. Command result not sent."
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

  Serial.println(
    "Sending command result:"
  );

  Serial.println(json);

  int responseCode =
    http.POST(json);

  Serial.print(
    "Command result response: "
  );

  Serial.println(responseCode);

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

  if (enrollmentRunning) {

    return;
  }

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

    Serial.println(
      "Could not fetch device command."
    );

    http.end();

    return;
  }

  String response =
    http.getString();

  Serial.println();

  Serial.println(
    "Command server response:"
  );

  Serial.println(response);

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
  // Check whether command exists
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
    doc["command"]["fingerprintId"];

  Serial.println();

  Serial.println(
    "================================"
  );

  Serial.println(
    "PENDING DEVICE COMMAND"
  );

  Serial.println(
    "================================"
  );

  Serial.print(
    "Command: "
  );

  Serial.println(command);

  Serial.print(
    "Command ID: "
  );

  Serial.println(commandId);

  Serial.print(
    "Fingerprint ID: "
  );

  Serial.println(
    fingerprintId
  );

  // ===================================================
  // ENROLL FINGERPRINT
  // ===================================================

  if (
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

      // Update device status
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

      // Tell server deletion succeeded
      sendCommandResult(
        commandId,
        true
      );

      // Update device status
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

  if (!fingerprintConnected) {

    return;
  }

  uint8_t result;

  // ---------------------------------------------------
  // Wait for finger
  // ---------------------------------------------------

  result =
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
  // Search stored fingerprints
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

    // Send GRANTED event
    sendFingerprintEvent(
      finger.fingerID,
      "GRANTED"
    );

    // Turn LED ON
    digitalWrite(
      LED_PIN,
      HIGH
    );

    delay(2000);

    // Turn LED OFF
    digitalWrite(
      LED_PIN,
      LOW
    );

  } else {

    Serial.println(
      "Fingerprint NOT recognized."
    );

    // Send DENIED event
    sendFingerprintEvent(
      0,
      "DENIED"
    );

    // Turn buzzer ON
    digitalWrite(
      BUZZER_PIN,
      HIGH
    );

    delay(1000);

    // Turn buzzer OFF
    digitalWrite(
      BUZZER_PIN,
      LOW
    );
  }

  // ---------------------------------------------------
  // Wait until finger is removed
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

  Serial.begin(115200);

  delay(1000);

  // ---------------------------------------------------
  // LED
  // ---------------------------------------------------

  pinMode(
    LED_PIN,
    OUTPUT
  );

  digitalWrite(
    LED_PIN,
    LOW
  );

  // ---------------------------------------------------
  // Buzzer
  // ---------------------------------------------------

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  digitalWrite(
    BUZZER_PIN,
    LOW
  );

  // ---------------------------------------------------
  // AS608 Serial
  // ---------------------------------------------------

  fingerSerial.begin(
    57600,
    SERIAL_8N1,
    FINGER_RX,
    FINGER_TX
  );

  // ---------------------------------------------------
  // Startup message
  // ---------------------------------------------------

  Serial.println();

  Serial.println(
    "=============================="
  );

  Serial.println(
    " Smart Office Security System"
  );

  Serial.println(
    "=============================="
  );

  // ---------------------------------------------------
  // Wi-Fi
  // ---------------------------------------------------

  connectWiFi();

  // ---------------------------------------------------
  // Fingerprint sensor
  // ---------------------------------------------------

  checkFingerprintSensor();

  // ---------------------------------------------------
  // Initial device status
  // ---------------------------------------------------

  sendDeviceStatus();
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // ---------------------------------------------------
  // Check commands every 3 seconds
  // ---------------------------------------------------

  if (
    millis() - lastCommandCheck
    >= COMMAND_INTERVAL
  ) {

    lastCommandCheck =
      millis();

    checkForCommands();
  }

  // ---------------------------------------------------
  // Continuously scan fingerprints
  // ---------------------------------------------------

  scanFingerprint();

  // ---------------------------------------------------
  // Heartbeat every 30 seconds
  // ---------------------------------------------------

  static unsigned long lastStatusTime = 0;

  if (
    millis() - lastStatusTime
    >= 30000
  ) {

    lastStatusTime =
      millis();

    // Check AS608
    checkFingerprintSensor();

    // Tell Next.js we're still online
    sendDeviceStatus();
  }

  delay(100);
}
