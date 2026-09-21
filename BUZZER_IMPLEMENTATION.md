# Buzzer Control Implementation - Summary

## What Was Implemented

### 1. **Backend Infrastructure**

#### Database Schema (`convex/schema.ts`)
- Added `deviceCommands` table to store buzzer commands
- Fields: `deviceId`, `esp32Id`, `command` (TRIGGER_BUZZER | SILENCE_BUZZER), `durationMs`, `status` (PENDING | ACKNOWLEDGED | FAILED), timestamps
- Indexes for efficient querying by device and status

#### Convex Functions (`convex/deviceCommands.ts`)
- `triggerBuzzer(deviceId, durationMs?)` — Dashboard mutation to trigger buzzer (default 2s)
- `silenceBuzzer(deviceId)` — Dashboard mutation to silence buzzer
- `getPendingForDevice(esp32Id)` — Internal query for ESP32 to fetch pending commands
- `acknowledge(commandId)` — Internal mutation to mark command as acknowledged
- `markFailed(commandId, reason)` — Internal mutation to mark command as failed
- `listByDevice(deviceId)` — Public query to see command history
- `get(commandId)` — Public query to fetch single command

#### HTTP Endpoints (`convex/Http.ts`)
- `POST /esp32/commands` — ESP32 polls for pending commands every 2-5 seconds
- `POST /esp32/command-ack` — ESP32 acknowledges command execution (success or failure)

### 2. **Frontend Components**

#### BuzzerControl Component (`components/buzzer-control.tsx`)
- Displays trigger and silence buttons
- Shows pending command count
- Displays last command status and timestamp
- Shows error reasons if command fails
- Loading states during mutation
- Real-time command status via Convex

#### Devices Page (`app/dashboard/devices/page.tsx`)
- Lists all registered ESP32 devices
- Shows device status (ONLINE/OFFLINE)
- Displays last heartbeat timestamp
- Firmware version (if available)
- Integrates BuzzerControl component for each device
- Real-time device list updates

### 3. **Complete API Documentation** (`device.md`)

Comprehensive guide for ESP32 developers including:
- All 6 HTTP endpoints with full specifications
- Request/response formats with examples
- Arduino/ESP32 code examples for each endpoint
- Authentication via API key headers
- Error codes and handling
- Complete working example sketch
- cURL testing examples
- Best practices for reliability

---

## How It Works

### Dashboard to ESP32 Flow

1. **User clicks "Trigger Buzzer"** on the Devices page
2. **Dashboard calls** `api.deviceCommands.triggerBuzzer({ deviceId, durationMs: 2000 })`
3. **Convex creates** a new command record with status `PENDING`
4. **ESP32 polls** `POST /esp32/commands` every 2-5 seconds
5. **Server returns** pending commands including the buzzer command
6. **ESP32 executes**:
   - Reads `command` field: `"TRIGGER_BUZZER"`
   - Reads `durationMs`: `2000`
   - `digitalWrite(BUZZER_PIN, HIGH)`
   - `delay(2000)`
   - `digitalWrite(BUZZER_PIN, LOW)`
7. **ESP32 calls** `POST /esp32/command-ack` with `{ commandId, success: true }`
8. **Server updates** command status to `ACKNOWLEDGED`
9. **Dashboard shows** status change in real-time via Convex subscription

### Silence Command Flow

- Same as above, but command is `"SILENCE_BUZZER"`
- No `durationMs` field
- ESP32 just sets `digitalWrite(BUZZER_PIN, LOW)` immediately

### Error Handling

If ESP32 fails:
- Calls `POST /esp32/command-ack` with `{ commandId, success: false, errorReason: "..." }`
- Server marks command as `FAILED` with reason
- Dashboard displays error message to user
- User can retry by triggering buzzer again

---

## Files Changed/Created

### Modified
- `convex/schema.ts` — Added deviceCommands table
- `convex/Http.ts` — Added /esp32/commands and /esp32/command-ack endpoints

### Created
- `convex/deviceCommands.ts` — All buzzer command logic
- `components/buzzer-control.tsx` — Dashboard UI component
- `app/dashboard/devices/page.tsx` — Devices listing page
- `device.md` — Complete API documentation for ESP32

### Build Status
✅ All TypeScript checks passing
✅ Next.js build successful
✅ Convex schema updated
✅ Routes registered and tested

---

## Testing the Feature

### From ESP32 (using cURL)

```bash
# 1. Register device
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/register \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"esp32Id": "test-device-001", "name": "Test", "location": "Lab"}'

# 2. Poll for commands
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/commands \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"esp32Id": "test-device-001"}'

# 3. Acknowledge command
curl -X POST https://patient-salamander-245.eu-west-1.convex.cloud/esp32/command-ack \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"esp32Id": "test-device-001", "commandId": "...", "success": true}'
```

### From Dashboard

1. Navigate to `/dashboard/devices`
2. Register an ESP32 device via the `/esp32/register` endpoint
3. You should see it appear on the Devices page
4. Click **"Trigger Buzzer"** button
5. Command status shows "PENDING"
6. When ESP32 polls and executes, status changes to "ACKNOWLEDGED"
7. Click **"Silence"** to stop the buzzer

---

## Next Steps (When Ready)

1. **Fingerprint Enrollment** — Create `/api/enrollments` endpoints
2. **Dashboard Integration** — Connect real device data to mock sections
3. **Access Logs Page** — Real-time fingerprint events
4. **Alarms Page** — Real-time alarm display and acknowledgment
5. **Motion Events Page** — PIR sensor history
6. **Lock Control** — Add LOCK_DOOR / UNLOCK_DOOR commands (similar pattern)

---

## Key Architecture Decisions

✅ **Command Polling** — ESP32 polls server every 2-5 seconds (no incoming connections needed)
✅ **Acknowledgment Pattern** — Server can track command execution success/failure
✅ **Real-Time Dashboard** — Convex subscriptions automatically update UI
✅ **Stateless Endpoints** — ESP32 can lose connection; commands persist until fetched
✅ **Rate Limiting Ready** — Can add throttling per device if needed
✅ **Error Resilience** — Failed commands stored with reason for debugging

---

## API Key Setup

To use these endpoints, you must set the API key in Convex:

```bash
npx convex env set ESP32_API_KEY "your-secret-key-here"
```

Then flash the same key into your ESP32 sketch:

```cpp
const char* ESP32_API_KEY = "your-secret-key-here";
```

All requests must include:
```
Header: x-api-key: your-secret-key-here
```

---

## Documentation

See `device.md` for:
- Complete endpoint reference
- Request/response specifications
- Arduino/ESP32 code examples
- Error handling guide
- cURL testing examples
- Complete working example sketch
