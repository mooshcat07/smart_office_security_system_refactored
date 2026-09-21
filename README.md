# 🏢 IoT Security Access Control System

A modern, full-stack **IoT-enabled security access control platform** for managing ESP32 devices across facilities. Monitor fingerprint scanning, motion detection, and alarm systems in real-time with a comprehensive dashboard.

## ✨ Key Features

- 🔐 **Role-Based Access Control** - ADMIN and SECURITY roles with fine-grained permissions
- 📱 **Device Management** - Monitor ESP32 devices with live status, uptime, and sensor health
- 📊 **Real-Time Analytics** - Access event trends, motion detection patterns, alarm monitoring
- 👥 **User Management** - Create and manage system users with audit logging
- 🚨 **Alarm System** - Receive and track unauthorized access and tampering events
- 📈 **Access Logs** - Searchable, filterable history of all access attempts
- 🌓 **Dark Mode** - Beautiful UI with theme switching
- ⚡ **Modern Stack** - Next.js 16, React 19, TypeScript, PostgreSQL, Prisma

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
# Create .env.local in root directory
cp .env.example .env.local

# 3. Configure database URL
# Edit .env.local with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/security_system"

# 4. Run database migrations
npx prisma migrate dev --name init

# 5. Generate Prisma Client
npx prisma generate

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

### Default Credentials (Development)
- Email: `admin@example.com`
- Password: Check your database seed script

## 📊 Dashboard Overview

### Pages

| Page | Route | Purpose |
|------|-------|---------|
| **Overview** | `/dashboard` | System health, charts, quick stats |
| **Devices** | `/dashboard/devices` | Manage and monitor all ESP32 devices |
| **Access Logs** | `/dashboard/access-logs` | Searchable access event history |
| **Alarms** | `/dashboard/alarms` | Real-time alarm monitoring |
| **Motion Events** | `/dashboard/motion-events` | PIR motion detection timeline |
| **Users** | `/dashboard/users` | User and role management |

## 🔌 IoT Integration

### Device Capabilities
Each ESP32 device includes:
- **Fingerprint Sensor** - Biometric access control
- **PIR Motion Sensor** - Presence detection
- **Alarm System** - Alert on unauthorized access
- **WiFi Connectivity** - Live status updates
- **OTA Firmware Updates** - Remote software updates

### Device Data Structure

```typescript
{
  id: "dev-001",
  name: "Main Entrance",
  location: "Front Door",
  floor: "Ground Floor",
  ipAddress: "192.168.1.101",
  status: "ONLINE" | "OFFLINE",
  lastSeen: "2026-09-14T15:17:06Z",
  firmwareVersion: "v1.2.3",
  totalScansToday: 102,
  deniedToday: 12,
  motionEventsToday: 9,
  uptime: 99,
  sensors: { fingerprint: true, pir: true, alarm: true }
}
```

### API Endpoints (To Be Implemented)

```
# Device Management
POST   /api/devices/register          # Register new device
GET    /api/devices                   # List all devices
GET    /api/devices/:id               # Get device details
PUT    /api/devices/:id               # Update device config
DELETE /api/devices/:id               # Remove device

# Device Events
POST   /api/devices/:id/heartbeat     # Device status ping
POST   /api/access-events             # Log fingerprint scan
POST   /api/motion-events             # Log motion detection
POST   /api/alarms                    # Report alarm event

# Device Updates
GET    /api/devices/:id/config        # Get latest config
GET    /api/devices/:id/firmware      # Check firmware version
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start development server with hot reload
npm run build     # Build for production
npm start         # Run production server
npm run lint      # Run ESLint and TypeScript checks
npx prisma studio # Open Prisma Studio GUI
```

### Project Structure

```
project/
├── app/
│   ├── (auth)/                # Authentication pages
│   ├── api/                   # API routes
│   └── dashboard/             # Dashboard pages
├── components/                # Reusable React components
├── lib/                       # Utilities and helpers
├── prisma/
│   └── schema.prisma          # Database schema
├── hooks/                     # Custom React hooks
├── public/                    # Static assets
└── styles/                    # Global styles
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.3.5 |
| **UI Library** | React 19.2.8 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | PostgreSQL + Prisma 7.9.1 |
| **Authentication** | Better Auth 1.6.25 |
| **UI Components** | Shadcn/ui, Base UI |
| **Charts** | Recharts 3.8.0 |
| **Real-time** | Convex 1.43.0 |
| **Form Validation** | Zod 4.4.3 |
| **Drag & Drop** | dnd-kit 6.3.1 |
| **Icons** | Lucide React 1.28.0 |

## 🔐 Authentication & Security

### User Roles

```typescript
enum UserRole {
  ADMIN    // Full access - manage devices, users, settings
  SECURITY // Limited access - view logs and monitoring only
}
```

### Session Management
- Token-based authentication
- Session tracking with IP address and user agent
- Automatic session expiration
- Email verification support

### Security Features (Current)
✅ Better Auth integration  
✅ Password hashing  
✅ Session tokens  
✅ Role-based access control  
✅ Email verification  

### Security Features (To Implement)
- [ ] API key authentication for devices
- [ ] TLS/HTTPS enforcement
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Fingerprint data encryption
- [ ] CORS configuration

## 📦 Database Schema

### Current Models
- **User** - System users with roles
- **Session** - Active user sessions
- **Account** - OAuth/local authentication accounts
- **Verification** - Email verification tokens

### Future Models (IoT Ready)
- **Device** - ESP32 device records
- **Sensor** - Individual sensor status
- **AccessEvent** - Fingerprint scan logs
- **MotionEvent** - PIR detection events
- **AlarmEvent** - Security alerts

See `SYSTEM_DOCUMENTATION.md` for full schema details.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Connect your GitHub repo
# Vercel will auto-detect Next.js

# Set environment variables in Vercel dashboard:
# - DATABASE_URL
# - Any auth provider secrets

# Push to main branch to deploy
git push origin main
```

### Deploy to Other Platforms

- **AWS**: Use EC2 + RDS PostgreSQL
- **Railway**: Railway.app (simple, PostgreSQL included)
- **DigitalOcean**: App Platform + Managed Database
- **Docker**: Build with Dockerfile (included)

## 📖 Documentation

- **[SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)** - Comprehensive system architecture and IoT integration guide
- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[Prisma Docs](https://www.prisma.io/docs/)** - Database ORM documentation
- **[Better Auth Docs](https://www.better-auth.com/)** - Authentication framework

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📋 Roadmap

- [ ] IoT device API endpoints
- [ ] Real-time device status with Convex
- [ ] Firmware OTA update system
- [ ] Advanced analytics and reports
- [ ] Mobile app for remote monitoring
- [ ] Email notifications for alarms
- [ ] Device configuration management UI
- [ ] Compliance reporting (GDPR, HIPAA)
- [ ] Multi-facility support
- [ ] API rate limiting and throttling

## 🐛 Known Issues

- Device data is currently mocked - awaiting IoT integration
- Real-time updates require Convex setup
- Motion events page UI needs data connection

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/security_system

# Authentication
BETTER_AUTH_SECRET=your_secret_key_here

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional: Convex (Real-time)
NEXT_PUBLIC_CONVEX_URL=
```

## 📞 Support

- 📧 Email: support@securitysystem.com
- 💬 Discord: [Join our server](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/security-system/issues)

## 📄 License

MIT License - see LICENSE file for details

---

**Version**: 0.1.0  
**Last Updated**: September 14, 2026  
**Status**: MVP Ready for IoT Device Integration
