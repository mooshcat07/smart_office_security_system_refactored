# IoT Security Access Control System - Documentation

## 📋 Project Overview

This is a modern **IoT-enabled security access control platform** built with Next.js 16, React 19, and PostgreSQL. The system manages multiple ESP32 IoT devices deployed across a facility to monitor and control access points using fingerprint scanning, PIR motion detection, and alarm systems.

**Current Status**: MVP with device management dashboard and access logging infrastructure ready for IoT device integration.

---

## 🏗️ System Architecture

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js, React, TypeScript | 16.3.5, 19.2.8 |
| **Styling** | Tailwind CSS, Shadcn UI | 4.x, Base UI |
| **Database** | PostgreSQL + Prisma ORM | 7.9.1 |
| **Auth** | Better Auth | 1.6.25 |
| **Real-time** | Convex | 1.43.0 |
| **Charts** | Recharts | 3.8.0 |
| **UI Components** | Lucide Icons, Sonner Toasts | Latest |
| **Drag & Drop** | dnd-kit | 6.3.1 |
| **Validation** | Zod | 4.4.3 |

### Directory Structure

```
project/
├── app/
│   ├── (auth)/                    # Authentication routes
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── api/
│   │   └── auth/[...all]/route.ts # Auth API endpoints
│   ├── dashboard/                 # Main dashboard pages
│   │   ├── page.tsx              # Overview dashboard
│   │   ├── devices/page.tsx      # Device management
│   │   ├── access-logs/page.tsx  # Access log history
│   │   ├── alarms/page.tsx       # Alarm monitoring
│   │   ├── motion-events/page.tsx # Motion detection events
│   │   └── users/page.tsx        # User management
│   └── generated/prisma/         # Auto-generated Prisma types
├── components/                    # Reusable UI components
├── lib/                          # Utilities & helpers
├── prisma/
│   └── schema.prisma             # Database schema
├── public/                       # Static assets
└── hooks/                        # Custom React hooks
```

---

## 🗄️ Database Schema

### Models

#### **User**
Manages system users with role-based access control.

```prisma
- id: String (unique identifier)
- name: String
- email: String (unique)
- emailVerified: Boolean
- image: String (optional)
- password: String (optional - for local auth)
- role: UserRole (ADMIN | SECURITY)
- createdAt: DateTime
- updatedAt: DateTime
- sessions: Session[] (one-to-many)
- accounts: Account[] (one-to-many)
```

#### **Session**
Tracks active user sessions with device info.

```prisma
- id: String (unique identifier)
- token: String (unique session token)
- expiresAt: DateTime
- ipAddress: String (optional)
- userAgent: String (optional)
- userId: String (foreign key)
- user: User (relation)
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Account**
OAuth and local authentication accounts.

```prisma
- id: String (unique identifier)
- providerId: String
- accountId: String
- accessToken: String
- refreshToken: String
- scope: String
- userId: String (foreign key)
- createdAt/updatedAt: DateTime
```

#### **Verification**
Email verification and password reset tokens.

```prisma
- id: String
- identifier: String
- value: String
- expiresAt: DateTime
```

### Future IoT Models (To Be Added)

```prisma
model Device {
  id: String @id
  name: String              # e.g., "Main Entrance"
  location: String          # e.g., "Front Door"
  floor: String             # e.g., "Ground Floor"
  ipAddress: String         # e.g., "192.168.1.101"
  macAddress: String        # Unique device identifier
  status: DeviceStatus      # ONLINE | OFFLINE
  firmwareVersion: String   # e.g., "v1.2.3"
  lastSeen: DateTime
  createdAt: DateTime
  updatedAt: DateTime
  
  sensors: Sensor[]         # Fingerprint, PIR, Alarm
  accessEvents: AccessEvent[]
  motionEvents: MotionEvent[]
  createdBy: String         # userId
}

model Sensor {
  id: String @id
  deviceId: String
  type: SensorType          # FINGERPRINT | PIR | ALARM
  status: Boolean           # Active/Inactive
  device: Device @relation
}

model AccessEvent {
  id: String @id
  deviceId: String
  userId: String            # User who was scanned
  fingerprint: String       # Scanned fingerprint data
  status: AccessStatus      # GRANTED | DENIED
  timestamp: DateTime
  device: Device @relation
}

model MotionEvent {
  id: String @id
  deviceId: String
  timestamp: DateTime
  duration: Int             # Seconds of motion detected
  device: Device @relation
}

model AlarmEvent {
  id: String @id
  deviceId: String
  type: AlarmType           # UNAUTHORIZED_ACCESS | TAMPERING
  severity: Int             # 1-5
  resolved: Boolean
  timestamp: DateTime
  device: Device @relation
}
```

---

## 📊 Dashboard Pages

### 1. **Overview Dashboard** (`/dashboard`)
Main landing page with system health summary.
- Real-time device status
- Access events chart
- Quick stats
- Recent activity log

### 2. **Devices** (`/dashboard/devices`)
Central hub for IoT device management.

**Features**:
- Display all ESP32 devices with live status
- Device cards showing:
  - Device name, location, floor
  - Online/Offline status with WiFi indicator
  - Today's statistics (scans, denied, motion events)
  - Uptime percentage
  - Sensor status indicators (Fingerprint, PIR, Alarm)
  - IP address, firmware version, last seen time
- Summary cards: Online count, Offline count, Firmware updates needed
- Refresh button for manual device sync

**Current Data Structure**:
```typescript
type Device = {
  id: string
  name: string
  location: string
  floor: string
  ipAddress: string
  status: "ONLINE" | "OFFLINE"
  lastSeen: string
  firmwareVersion: string
  totalScansToday: number
  deniedToday: number
  motionEventsToday: number
  uptime: number // percentage
  sensors: { fingerprint: boolean; pir: boolean; alarm: boolean }
}
```

### 3. **Access Logs** (`/dashboard/access-logs`)
Historical record of all access attempts.
- Sortable data table with filtering
- Columns: Timestamp, User, Device, Status (Granted/Denied)
- Export/Search capabilities

### 4. **Alarms** (`/dashboard/alarms`)
Real-time alarm monitoring and management.
- Alert status indicators
- Alarm types: Unauthorized access, tampering, sensor failure
- Severity levels
- Resolution tracking

### 5. **Motion Events** (`/dashboard/motion-events`)
PIR motion detection history.
- Timeline of motion detection events
- Duration of motion detected
- Device location
- Time-based filtering

### 6. **Users** (`/dashboard/users`)
User and role management.
- Active user list
- User roles: ADMIN, SECURITY
- Session management
- Account creation/editing
- Last login tracking

---

## 🔐 Authentication & Authorization

### Authentication Flow
- **Provider**: Better Auth v1.6.25
- **Adapter**: Prisma with PostgreSQL
- **Session Management**: Token-based with expiration tracking
- **Supported Methods**: 
  - Local authentication (email/password)
  - OAuth integration ready
  - Email verification

### User Roles
```typescript
enum UserRole {
  ADMIN     // Full system access, device management
  SECURITY  // View-only access to logs and monitoring
}
```

---

## 🔌 IoT Integration (Ready for Tomorrow)

### ESP32 Device Communication

**Protocol**: HTTP REST API (recommended) or MQTT (scalable alternative)

**Device Configuration**:
```json
{
  "device_id": "dev-001",
  "name": "Main Entrance",
  "location": "Front Door",
  "wifi_ssid": "YourNetwork",
  "api_endpoint": "https://yourdomain.com/api",
  "update_interval": 30000,
  "sensors": {
    "fingerprint": true,
    "pir": true,
    "alarm": true
  }
}
```

### Expected IoT Endpoints (To Be Created)

```
POST /api/devices/register         # Device registration
POST /api/devices/{id}/heartbeat   # Keep-alive pings (every 30s)
POST /api/access-events            # Log access attempts
POST /api/motion-events            # Log motion detection
POST /api/alarms                   # Report alarm events
GET  /api/devices/{id}/config      # Get device config updates
```

### Device Heartbeat Schema
```json
{
  "device_id": "dev-001",
  "status": "ONLINE",
  "timestamp": "2026-09-14T15:17:06Z",
  "sensors_status": {
    "fingerprint": true,
    "pir": true,
    "alarm": true
  },
  "uptime_percentage": 99,
  "memory_usage": 65,
  "signal_strength": -45
}
```

### Access Event Schema
```json
{
  "device_id": "dev-001",
  "fingerprint_template": "...",
  "match_score": 98.5,
  "granted": true,
  "timestamp": "2026-09-14T15:17:06Z",
  "reason": "Authorized user"
}
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn

### Installation

1. **Clone and setup**
```bash
cd project
npm install
```

2. **Database setup**
```bash
# Create .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/security_system"

# Run migrations
npx prisma migrate dev --name init
```

3. **Run development server**
```bash
npm run dev
```
Access at `http://localhost:3000`

4. **Build for production**
```bash
npm run build
npm start
```

---

## 📡 Connecting IoT Devices (Tomorrow's Tasks)

### Step 1: Create API Endpoints
- Device registration endpoint
- Heartbeat/status update endpoint
- Event logging endpoints (access, motion, alarms)

### Step 2: Update Prisma Schema
Add Device, Sensor, AccessEvent, MotionEvent, AlarmEvent models

### Step 3: Device Management UI
- Device registration form
- Firmware OTA update interface
- Sensor configuration panel

### Step 4: Real-time Updates
- WebSocket integration (via Convex) for live device status
- Real-time alerts for alarms and unauthorized access

### Step 5: Data Persistence
- Store device telemetry in PostgreSQL
- Archive old events for compliance

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev       # Start dev server with hot reload
npm run build     # Production build
npm start         # Run production server
npm run lint      # Run ESLint
```

### Key Technologies

| Feature | Library | Purpose |
|---------|---------|---------|
| Data Tables | TanStack React Table | Sortable, filterable access logs |
| Drag & Drop | dnd-kit | Reorderable UI elements |
| Real-time | Convex | Live device updates (optional) |
| Charts | Recharts | Access trends visualization |
| UI Components | Shadcn/Base UI | Modern, accessible components |
| Forms/Validation | Zod | Type-safe form validation |
| Notifications | Sonner | Toast notifications |

---

## 📈 Performance & Scalability

### Current Limitations & Improvements
- **Static Device Data**: Devices page uses mock data - needs database integration
- **Real-time Updates**: Convex ready but not fully implemented
- **Session Tracking**: IP and User-Agent captured for audit
- **Scalability**: PostgreSQL can handle thousands of devices, millions of events

### Optimization Tips
1. Implement device polling throttling (heartbeat every 30-60s)
2. Archive old events to separate database
3. Use Convex subscriptions for real-time device status
4. Paginate access logs (already has TanStack Table)
5. Cache device configurations

---

## 🔒 Security Considerations

### Current Implementation
- ✅ User authentication with Better Auth
- ✅ Session token management
- ✅ Role-based access control (ADMIN/SECURITY)
- ✅ Password hashing (Better Auth handles this)
- ✅ Email verification support

### To Implement
- [ ] API key authentication for IoT devices
- [ ] TLS/HTTPS for all device communications
- [ ] Rate limiting on device endpoints
- [ ] Audit logging for all access events
- [ ] Encryption of sensitive fingerprint data
- [ ] CORS configuration for device origins

---

## 📞 Support & Next Steps

### Tomorrow's Priority Tasks
1. Create IoT device API endpoints
2. Add Device model to Prisma schema
3. Connect first ESP32 device
4. Set up device registration flow
5. Implement real-time device status updates

### Questions to Define
- How many devices will you deploy initially?
- What's your preferred IoT protocol (HTTP, MQTT, CoAP)?
- Do you need cloud storage for historical data?
- What's your compliance requirement (GDPR, HIPAA)?

---

**Last Updated**: 2026-09-14  
**System Version**: 0.1.0  
**Status**: MVP Ready for IoT Integration
