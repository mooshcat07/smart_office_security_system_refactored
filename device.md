# ESP32 Smart Office Security System - Device API Documentation

This document describes all HTTP endpoints available for ESP32 devices to communicate with the Next.js backend (Convex).

## Authentication

All requests must include the API key header:

```
x-api-key: {ESP32_API_KEY}
```

The `ESP32_API_KEY` is set in your Convex deployment environment variables:

```bash
npx convex env set ESP32_API_KEY your-secret-key-here
```

Flash this same value into your ESP32 sketch.

**Base URL:** `https://patient-salamander-245.eu-west-1.convex.cloud`

---

## 1. Device Registration

### Endpoint
```
POST /esp32/register
```

### Description
Register an ESP32 device on first boot or after re-flashing. The device sends its hardware ID, name, and location. If the device is already registered, it will be updated (upserted).

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "name": "Main Entrance",
  "location": "Ground Floor",
  "firmware": "1.0.0"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Unique hardware ID (e.g., MAC address or burned-in ID). Must be consistent across reboots. |
| `name` | string | Yes | Human-readable name for this device (e.g., "Main Entrance", "Server Room"). |
| `location` | string | Yes | Physical location (e.g., "Ground Floor", "Building A"). |
| `firmware` | string | No | Firmware version. Optional, helps track which devices need updates. |

### Response (Success)
```json
{
  "ok": true,
  "deviceId": "k0x1y2z3a4b5c6d7e8f9g0h1"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` on success. |
| `deviceId` | string | The internal Convex ID for this device. You don't need to store this; it's returned for debugging. |

### Response (Error)
```json
{
  "error": "esp32Id (string) is required"
}
```

Status codes:
- `200` — Success
- `400` — Validation error (missing/invalid fields)
- `401` — Invalid or missing API key
- `500` — Server misconfigured (ESP32_API_KEY not set)

### Example (Arduino/ESP32)
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void registerDevice() {
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/register";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  String esp32Id = WiFi.macAddress(); // or use burned-in chip ID
  
  StaticJsonDocument<200> doc;
  doc["esp32Id"] = esp32Id;
  doc["name"] = "Main Entrance";
  doc["location"] = "Ground Floor";
  doc["firmware"] = "1.0.0";

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    DynamicJsonDocument response(256);
    deserializeJson(response, http.getString());
    Serial.println("Device registered: " + response["deviceId"].as<String>());
  }
  http.end();
}
```

---

## 2. Device Heartbeat

### Endpoint
```
POST /esp32/heartbeat
```

### Description
Periodically send a heartbeat to tell the server the device is alive. Call this every 30–60 seconds. If the server doesn't receive a heartbeat for 2 minutes, the device will be marked OFFLINE on the dashboard.

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "firmware": "1.0.0"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Your device's hardware ID (must match registration). |
| `firmware` | string | No | Current firmware version. Optional. |

### Response (Success)
```json
{
  "ok": true,
  "deviceId": "k0x1y2z3a4b5c6d7e8f9g0h1"
}
```

### Response (Error)
```json
{
  "error": "Unknown device: ESP32_A1B2C3D4E5F6. Register it first."
}
```

Status codes:
- `200` — Success
- `400` — Validation error
- `401` — Invalid or missing API key
- `404` — Device not found (register first)

### Example (Arduino/ESP32)
```cpp
void sendHeartbeat() {
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/heartbeat";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<150> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["firmware"] = "1.0.0";

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.printf("Heartbeat: %d\n", httpCode);
  http.end();
}

void setup() {
  // ... WiFi setup ...
  
  // Send heartbeat every 30 seconds
  ticker.attach(30, sendHeartbeat);
}
```

---

## 3. Fingerprint Access Log

### Endpoint
```
POST /esp32/access-log
```

### Description
Record every fingerprint scan (successful or rejected). Called by the fingerprint sensor when a finger is presented. The dashboard displays these as access attempts.

**Important:** The fingerprint matching happens on the ESP32. You send the `status` (GRANTED or DENIED) that you determined locally.

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body (Successful Match)
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "fingerprintId": 5,
  "status": "GRANTED"
}
```

### Request Body (Rejected / Unrecognized)
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "fingerprintId": null,
  "status": "DENIED"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Your device's hardware ID. |
| `fingerprintId` | number or null | No | The fingerprint ID stored on the sensor (0–127 or 0–999, depending on your sensor). `null` if unrecognized. |
| `status` | string | Yes | Either `"GRANTED"` (authorized) or `"DENIED"` (rejected). |

### Response (Success)
```json
{
  "ok": true,
  "accessLogId": "a1b2c3d4e5f6g7h8i9j0k1l2",
  "alarmRaised": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` on success. |
| `accessLogId` | string | Internal ID of the logged event. |
| `alarmRaised` | boolean | `true` if this scan triggered an alarm (e.g., repeated denials). |

### Response (Error)
```json
{
  "error": "Unknown device: ESP32_A1B2C3D4E5F6. Register it first."
}
```

Status codes:
- `200` — Success (log created, may or may not have triggered alarm)
- `400` — Validation error
- `401` — Invalid or missing API key
- `404` — Device not found (register first)

### Alarm Rules
- If a device records **3 or more DENIED scans within 10 minutes**, an alarm is automatically raised.
- The dashboard will display this as a `MEDIUM` severity alarm.
- Only one alarm per device will be active at a time (they are deduplicated).

### Example (Arduino/ESP32)
```cpp
#include "DFRobot_Fingerprint.h"

// Initialize fingerprint sensor on Serial2
SoftwareSerial fingerprintSerial(RX_PIN, TX_PIN);
DFRobot_Fingerprint fingerSensor(&fingerprintSerial);

void handleFingerprintScan() {
  int fingerprintId = fingerSensor.detectFingerprint();
  
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/access-log";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<200> doc;
  doc["esp32Id"] = WiFi.macAddress();

  bool authorized = isAuthorized(fingerprintId);
  if (authorized) {
    doc["fingerprintId"] = fingerprintId;
    doc["status"] = "GRANTED";
    unlockDoor();
  } else {
    doc["fingerprintId"] = nullptr;
    doc["status"] = "DENIED";
    triggerAlarmBuzzer();
  }

  String payload;
  serializeJson(doc, payload);

  http.POST(payload);
  http.end();
}
```

---

## 4. Motion Detection Event

### Endpoint
```
POST /esp32/motion-event
```

### Description
Record when the PIR motion sensor detects movement. Called whenever motion is detected.

**Alarm Rules:** If motion is detected **after hours (18:00–07:00)**, a `HIGH` severity alarm is automatically raised.

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Your device's hardware ID. |

### Response (Success)
```json
{
  "ok": true,
  "motionEventId": "x1y2z3a4b5c6d7e8f9g0h1i2",
  "alarmRaised": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` on success. |
| `motionEventId` | string | Internal ID of the motion event. |
| `alarmRaised` | boolean | `true` if motion triggered an alarm (typically `true` during after-hours). |

### Response (Error)
```json
{
  "error": "Unknown device: ESP32_A1B2C3D4E5F6. Register it first."
}
```

Status codes:
- `200` — Success
- `400` — Validation error
- `401` — Invalid or missing API key
- `404` — Device not found (register first)

### Example (Arduino/ESP32)
```cpp
const int PIR_PIN = 4;

void setupPIR() {
  pinMode(PIR_PIN, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIR_PIN), onMotionDetected, CHANGE);
}

void onMotionDetected() {
  if (digitalRead(PIR_PIN) == HIGH) {
    Serial.println("Motion detected!");
    sendMotionEvent();
  }
}

void sendMotionEvent() {
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/motion-event";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<100> doc;
  doc["esp32Id"] = WiFi.macAddress();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.printf("Motion event sent: %d\n", httpCode);
  http.end();
}
```

---

## 5. Fetch Pending Commands

### Endpoint
```
POST /esp32/commands
```

### Description
Poll for commands from the dashboard (e.g., trigger buzzer, silence alarm). Call this every 2–5 seconds so the device responds quickly to dashboard actions.

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Your device's hardware ID. |

### Response (Success - No Commands)
```json
{
  "ok": true,
  "commands": []
}
```

### Response (Success - With Commands)
```json
{
  "ok": true,
  "commands": [
    {
      "_id": "c1d2e3f4g5h6i7j8k9l0m1n2",
      "_creationTime": 1694700000000,
      "deviceId": "k0x1y2z3a4b5c6d7e8f9g0h1",
      "esp32Id": "ESP32_A1B2C3D4E5F6",
      "command": "TRIGGER_BUZZER",
      "durationMs": 2000,
      "status": "PENDING",
      "createdAt": 1694700000000
    },
    {
      "_id": "d1e2f3g4h5i6j7k8l9m0n1o2",
      "_creationTime": 1694700005000,
      "deviceId": "k0x1y2z3a4b5c6d7e8f9g0h1",
      "esp32Id": "ESP32_A1B2C3D4E5F6",
      "command": "SILENCE_BUZZER",
      "status": "PENDING",
      "createdAt": 1694700005000
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Always `true` on success. |
| `commands` | array | List of pending commands. Empty if no commands. |
| `commands[].command` | string | Either `"TRIGGER_BUZZER"` or `"SILENCE_BUZZER"`. |
| `commands[].durationMs` | number | (TRIGGER_BUZZER only) How long to buzz in milliseconds. Typical: 2000 (2 seconds). |
| `commands[].status` | string | Always `"PENDING"` when fetched. |
| `commands[]._id` | string | The command ID. Use this when sending acknowledgment. |

### Response (Error)
```json
{
  "error": "Unknown device: ESP32_A1B2C3D4E5F6. Register it first."
}
```

Status codes:
- `200` — Success (may have zero or more commands)
- `400` — Validation error
- `401` — Invalid or missing API key
- `404` — Device not found (register first)

### Example (Arduino/ESP32)
```cpp
void checkForCommands() {
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/commands";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<100> doc;
  doc["esp32Id"] = WiFi.macAddress();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    DynamicJsonDocument response(1024);
    deserializeJson(response, http.getString());

    JsonArray commands = response["commands"];
    for (JsonObject cmd : commands) {
      String commandId = cmd["_id"];
      String command = cmd["command"];
      
      if (command == "TRIGGER_BUZZER") {
        int durationMs = cmd["durationMs"];
        triggerBuzzer(durationMs);
        acknowledgeCommand(commandId, true);
      } else if (command == "SILENCE_BUZZER") {
        silenceBuzzer();
        acknowledgeCommand(commandId, true);
      }
    }
  }
  http.end();
}

void setup() {
  // Poll every 3 seconds
  ticker.attach(3, checkForCommands);
}
```

---

## 6. Acknowledge Command

### Endpoint
```
POST /esp32/command-ack
```

### Description
Tell the server that you received and executed (or failed to execute) a command. The dashboard uses this to update command status.

### Request Headers
```
x-api-key: {ESP32_API_KEY}
Content-Type: application/json
```

### Request Body (Success)
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "commandId": "c1d2e3f4g5h6i7j8k9l0m1n2",
  "success": true
}
```

### Request Body (Failure)
```json
{
  "esp32Id": "ESP32_A1B2C3D4E5F6",
  "commandId": "c1d2e3f4g5h6i7j8k9l0m1n2",
  "success": false,
  "errorReason": "Buzzer circuit not responding"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `esp32Id` | string | Yes | Your device's hardware ID. |
| `commandId` | string | Yes | The `_id` from the command you fetched. |
| `success` | boolean | Yes | `true` if the command executed successfully. |
| `errorReason` | string | No | If `success` is `false`, explain what went wrong. |

### Response (Success)
```json
{
  "ok": true
}
```

### Response (Error)
```json
{
  "error": "commandId (string) is required"
}
```

Status codes:
- `200` — Success
- `400` — Validation error
- `401` — Invalid or missing API key
- `404` — Device not found (register first)

### Example (Arduino/ESP32)
```cpp
void acknowledgeCommand(String commandId, bool success, String errorReason = "") {
  HTTPClient http;
  String url = "https://patient-salamander-245.eu-west-1.convex.cloud/esp32/command-ack";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<200> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["commandId"] = commandId;
  doc["success"] = success;
  if (!success) {
    doc["errorReason"] = errorReason;
  }

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  Serial.printf("Command ack: %d\n", httpCode);
  http.end();
}
```

---

## Complete ESP32 Sketch Example

Here's a minimal working example that demonstrates all endpoints:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Ticker.h>

// Configuration
const char* SSID = "your-ssid";
const char* PASSWORD = "your-password";
const char* ESP32_API_KEY = "your-api-key";
const char* API_BASE = "https://patient-salamander-245.eu-west-1.convex.cloud";

Ticker ticker;
String deviceId = "";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Register device
  registerDevice();

  // Send heartbeat every 30 seconds
  ticker.attach(30, sendHeartbeat);

  // Poll for commands every 3 seconds
  ticker.attach(3, checkForCommands);

  // Simulate motion event after 10 seconds
  delay(10000);
  sendMotionEvent();

  // Simulate fingerprint scan after 15 seconds
  delay(5000);
  sendAccessLog(5, "GRANTED");
}

void loop() {
  delay(1000);
}

void registerDevice() {
  HTTPClient http;
  http.begin(API_BASE "/esp32/register");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<200> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["name"] = "Test Device";
  doc["location"] = "Lab";
  doc["firmware"] = "1.0.0";

  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  if (code == 200) {
    DynamicJsonDocument response(256);
    deserializeJson(response, http.getString());
    Serial.println("Device registered!");
  }
  http.end();
}

void sendHeartbeat() {
  HTTPClient http;
  http.begin(API_BASE "/esp32/heartbeat");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<150> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["firmware"] = "1.0.0";

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void sendAccessLog(int fingerprintId, const char* status) {
  HTTPClient http;
  http.begin(API_BASE "/esp32/access-log");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<200> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["fingerprintId"] = fingerprintId;
  doc["status"] = status;

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void sendMotionEvent() {
  HTTPClient http;
  http.begin(API_BASE "/esp32/motion-event");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<100> doc;
  doc["esp32Id"] = WiFi.macAddress();

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}

void checkForCommands() {
  HTTPClient http;
  http.begin(API_BASE "/esp32/commands");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<100> doc;
  doc["esp32Id"] = WiFi.macAddress();

  String payload;
  serializeJson(doc, payload);

  int code = http.POST(payload);
  if (code == 200) {
    DynamicJsonDocument response(1024);
    deserializeJson(response, http.getString());

    JsonArray commands = response["commands"];
    for (JsonObject cmd : commands) {
      String commandId = cmd["_id"];
      String command = cmd["command"];

      if (command == "TRIGGER_BUZZER") {
        int duration = cmd["durationMs"];
        Serial.printf("Triggering buzzer for %d ms\n", duration);
        // TODO: digitalWrite(BUZZER_PIN, HIGH); delay(duration); digitalWrite(BUZZER_PIN, LOW);
        acknowledgeCommand(commandId, true);
      } else if (command == "SILENCE_BUZZER") {
        Serial.println("Silencing buzzer");
        // TODO: digitalWrite(BUZZER_PIN, LOW);
        acknowledgeCommand(commandId, true);
      }
    }
  }
  http.end();
}

void acknowledgeCommand(String commandId, bool success) {
  HTTPClient http;
  http.begin(API_BASE "/esp32/command-ack");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", ESP32_API_KEY);

  StaticJsonDocument<200> doc;
  doc["esp32Id"] = WiFi.macAddress();
  doc["commandId"] = commandId;
  doc["success"] = success;

  String payload;
  serializeJson(doc, payload);
  http.POST(payload);
  http.end();
}
```

---

## Error Handling Best Practices

1. **Always check HTTP status codes** — 200 is success, 400 is validation error, 401 is auth error, 404 is not found.
2. **Retry on network failure** — If POST fails, retry after a short delay (exponential backoff).
3. **Don't block on HTTP** — Use async HTTP or timers to avoid freezing the main loop.
4. **Log failures** — If a command fails, acknowledge with `success: false` and include a reason.
5. **Handle missing device** — If you get a 404, the device may not be registered. Call `/esp32/register` first.

---

## Testing

### Using cURL

```bash
# Register device
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001",
    "name": "Test Device",
    "location": "Lab",
    "firmware": "1.0.0"
  }'

# Send heartbeat
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/heartbeat \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001"
  }'

# Send access log
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/access-log \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001",
    "fingerprintId": 5,
    "status": "GRANTED"
  }'

# Send motion event
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/motion-event \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001"
  }'

# Fetch commands
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/commands \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001"
  }'

# Acknowledge command
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/command-ack \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "esp32Id": "test-device-001",
    "commandId": "c1d2e3f4g5h6i7j8k9l0m1n2",
    "success": true
  }'
```

---

## Summary

| Endpoint | Direction | Purpose | Frequency |
|----------|-----------|---------|-----------|
| `POST /esp32/register` | ESP32 → Server | Register device on boot | Once at startup |
| `POST /esp32/heartbeat` | ESP32 → Server | Keep device online | Every 30s |
| `POST /esp32/access-log` | ESP32 → Server | Log fingerprint scan | Per scan (~1-5 per min) |
| `POST /esp32/motion-event` | ESP32 → Server | Log motion detection | Per motion (~few per min) |
| `POST /esp32/commands` | ESP32 → Server | Fetch pending commands | Every 2-5s |
| `POST /esp32/command-ack` | ESP32 → Server | Confirm command executed | After each command |

---

## Support

For issues or questions:
1. Check that your device is registered: Dashboard → Devices
2. Verify API key is set: `npx convex env list`
3. Test endpoint manually with cURL
4. Check device logs in the Dashboard → Recent Events
5. Ensure WiFi connectivity and time synchronization on ESP32
