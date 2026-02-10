# Placement Management System (place_vig)

A full-stack placement management system for Vignan University with three apps:
- Backend API (Express + TypeScript + Supabase/PostgreSQL)
- Admin Web (React + Vite + Tailwind + shadcn/ui)
- Student Mobile App (Flutter)

This README explains how the project works and how to run each part on Windows. Keep it for future reference.

> **Note**: This project was migrated from MongoDB to Supabase (PostgreSQL). Row Level Security (RLS) has been implemented for enhanced data protection.

---

## Repository structure

```
place_vig/
├─ server/                 # Node.js + Express + TypeScript API
│  ├─ src/
│  ├─ package.json
│  └─ ...
├─ admin-nexus-97/         # React + Vite admin web app
│  ├─ src/
│  ├─ index.html
│  ├─ package.json
│  └─ ...
├─ student-app/            # Flutter student app (Android)
│  ├─ lib/
│  ├─ android/
│  └─ pubspec.yaml
└─ README.md               # This file
```

---

## How the project works (architecture)

- server (port 4000): REST API, JWT-based auth. Connects to Supabase (PostgreSQL database). Hosts resources: students, admins, drives, applications, notifications.
- admin-nexus-97: Web portal for admins to manage drives, students, applications, and send announcements. Calls the server via `VITE_API_URL`.
- student-app: Flutter mobile app for students to register/login, complete profile, view drives, apply, and receive in-app notifications. App can change the API host IP at runtime.

**Security**: Row Level Security (RLS) policies enforce data isolation. Backend uses service role key which bypasses RLS for full access. Direct database access (e.g., Supabase Dashboard, anon key) is restricted by RLS policies.

Roles:
- main-admin: Full access across branches
- branch-admin: Scoped to their branch (server and RLS enforce)
- student: Access only to their own data (enforced by RLS)

Key data flows:
- Student registration: public endpoint creates/upserts a student by `regd_id` and returns a 30-day token.
- Drives: admins publish drives; students see published drives filtered by eligibility (branch/CGPA) server-side.
- Applications: students apply; admins update statuses; notifications are generated.
- Notifications: shown inside the app; tapping may deep-link to target drive.

---

## Prerequisites and tools

Install these on your machine (Windows):

- Node.js 18+ (includes npm)
- Supabase account (free tier works)
- Git (optional but recommended)
- Java JDK 17+ (for Android builds)
- Android SDK / Android Studio (for building the APK)
- Flutter SDK (stable channel)
- Puro (optional; used to pin Flutter versions)

Verify tools:
- Node: `node -v` and `npm -v`
- Java: `java -version`
- Flutter: `flutter --version`
- Android SDK: set `ANDROID_HOME` and have `platform-tools` in PATH (`adb version`)
- Puro (optional): `puro --version`

Observed tool path from this project builds:
- Puro (example on your PC): `C:\Users\Out_boxeR\AppData\Local\Microsoft\WinGet\Links\puro.exe`

Note: If your `flutter` command is already in PATH, you do not need Puro; it’s optional.

---

## 1) Backend API (server)

Location: `server/`

Environment variables (create `server/.env`):
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here  # From Supabase Dashboard → Settings → API
API_KEY=your-anon-key-here                          # From Supabase Dashboard → Settings → API

# JWT Secret for authentication
JWT_SECRET=change_this_secret

# Server Configuration
HOST=0.0.0.0
PORT=4000

# Admin Bootstrap (first login creates main admin)
ADMIN_EMAIL=admin@vignan.edu
ADMIN_PASSWORD=secure_password_here

# Legacy MongoDB (no longer used, can be removed)
# MONGODB_URI=mongodb+srv://...
```

**Important**: 
- Get Supabase credentials from: Dashboard → Settings → API
- `SUPABASE_SERVICE_KEY` must be the **service_role key** (not anon key)
- Service role key bypasses RLS and is required for backend operations
- **Apply RLS Migration**: See `server/sql/README.md` for security setup

Install & run (dev):
```
cd server
npm install
npm run dev
```

Health check:
- http://localhost:4000/api/health (PC)
- http://<YOUR_LAN_IP>:4000/api/health (from phone on same Wi‑Fi)

Seed a test student (optional):
```
cd server
npm run seed:test-student -- VU2025001
```

---

## 2) Admin Web (admin-nexus-97)

Location: `admin-nexus-97/`

Development:
```
cd admin-nexus-97
npm install
set VITE_API_URL=http://<YOUR_LAN_IP>:4000/api
npm run dev
```
Open the dev URL (usually http://localhost:5173) in your browser.

Production build:
```
cd admin-nexus-97
set VITE_API_URL=http://<YOUR_LAN_IP>:4000/api
npm run build
```
Static assets will be in `admin-nexus-97/dist/`. Serve with any static server or host.

Admin bootstrap:
- First successful login to `/api/auth/login` creates the main admin with the credentials you use that first time.

Notes:
- Main Admin sees a Branch filter on Students page. Branch Admin does not (and is server-restricted to their branch).

---

## 3) Student Mobile App (student-app)

Location: `student-app/`

Build APK (using your flutter in PATH):
```
cd student-app
flutter pub get
flutter build apk --debug --target-platform android-arm64,android-x64
```

Build APK (using Puro, optional):
```
"C:\\Users\\Out_boxeR\\AppData\\Local\\Microsoft\\WinGet\\Links\\puro.exe" flutter build apk --debug --target-platform android-arm64,android-x64
```

Install the APK on your device:
- File path after build: `student-app\build\app\outputs\flutter-apk\app-debug.apk`
- Transfer to phone and install (enable install from unknown sources), or use `adb install`.

Configure API host inside the app:
- Open app → tap the gear icon (Settings) on Drives/Profile
- Set Server IP to your PC’s Wi‑Fi IP (e.g., `10.16.13.228`) — port 4000 is fixed
- Choose Theme: System / Light / Dark

Flows to test in app:
- Registration: Login screen → “New here? Register” → submit
- Login: enter Registration ID only (token lasts 30 days)
- Profile: complete required details; reminder disappears after saving
- Drives: view, open details (Hero animation), apply if eligible
- Applications: see status badges; changes reflect after admins update
- Notifications: pull-to-refresh; tap to open the related drive

---

## Quick Start (all apps together)

1) Start server:
```
cd server
npm install
npm run dev
```
Ensure http://<YOUR_LAN_IP>:4000/api/health returns 200.

2) Start admin (dev):
```
cd admin-nexus-97
npm install
set VITE_API_URL=http://<YOUR_LAN_IP>:4000/api
npm run dev
```
Login to bootstrap main admin.

3) Build & install student app:
```
cd student-app
flutter pub get
flutter build apk --debug --target-platform android-arm64,android-x64
```
Install the APK from `student-app/build/app/outputs/flutter-apk/app-debug.apk`. In app Settings, set Server IP.

---

## API overview (selected endpoints)

- Auth (student)
  - POST `/api/auth/student/register` → register or upsert student and login
  - POST `/api/auth/student/login` → login by regdId
  - GET `/api/auth/me` → current user info
- Students
  - GET `/api/students/me` (student) / PUT to update profile
  - GET `/api/students` (admin; optional `?branch=CSE`)
- Drives
  - GET `/api/drives?status=published`
  - GET `/api/drives/:id`
  - POST `/api/drives` (admin), PATCH/PUT to update
- Applications
  - POST `/api/applications` `{ drive_id }` (student)
  - GET `/api/applications?expand=1` (student’s list)
  - Admin actions to update statuses (pending → accepted/rejected)
- Notifications
  - GET `/api/notifications?me=1` (student in-app list)

---

## Environment variables

Server (`server/.env`):
- `SUPABASE_URL` – Supabase project URL (Dashboard → Settings → API)
- `SUPABASE_SERVICE_KEY` – Service role key for backend (bypasses RLS)
- `API_KEY` – Anon key for client access (optional)
- `JWT_SECRET` – Secret for JWT signing
- `HOST=0.0.0.0` – Listen on all interfaces
- `PORT=4000` – Server port
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` – First login bootstrap

Admin web:
- `VITE_API_URL=http://<YOUR_LAN_IP>:4000/api` for dev/build

Mobile app:
- Server IP configured at runtime in Settings (no rebuild needed)

## Database Security (RLS)

The project uses Row Level Security (RLS) for data protection:

1. **Apply RLS Migration** (one-time setup):
   - Open Supabase Dashboard → SQL Editor
   - Copy content from `server/sql/enable_rls.sql`
   - Execute the migration
   - See `server/sql/README.md` for detailed instructions

2. **How RLS Works**:
   - Backend API uses service_role key → full access (bypasses RLS)
   - Direct database access uses anon key → restricted by RLS policies
   - Students can only access their own data
   - Branch admins restricted to their branch
   - Main admins have full access

---

## Troubleshooting

- Phone can’t reach server:
  - PC and phone must be on same Wi‑Fi
  - Use Wi‑Fi IP, not `localhost`
  - Allow Node.js/port 4000 in Windows Firewall
- Flutter/Android build issues:
  - Ensure JDK 17+, Android SDK, and licenses accepted (`flutter doctor`)
- CORS issues on admin web:
  - Ensure `VITE_API_URL` points to your server and server CORS is enabled
- Database connection errors:
  - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
  - Ensure service key is correct (not anon key)
  - Check Supabase project is active in dashboard
- Backend returns 403 errors after applying RLS:
  - Verify you're using `SUPABASE_SERVICE_KEY` (service role) not anon key
  - Service role key bypasses RLS - check it's set correctly in `.env`

---

## Useful commands

Server:
```
cd server
npm run dev
npm run build
npm start
npm run seed:test-student -- VU2025XXXX
```

Admin web:
```
cd admin-nexus-97
npm run dev
set VITE_API_URL=http://<YOUR_LAN_IP>:4000/api && npm run build
```

Student app:
```
cd student-app
flutter pub get
flutter build apk --debug --target-platform android-arm64,android-x64
```

Puro (optional):
```
"C:\\Users\\Out_boxeR\\AppData\\Local\\Microsoft\\WinGet\\Links\\puro.exe" flutter --version
```

---

## What was installed / used with paths

These are the tools used to build/run the project. Your system might have them in different locations; verify with the suggested commands.

- Node.js + npm — verify: `where node`, `node -v`
- Java JDK 17+ — verify: `java -version`
- Android SDK — verify: `where adb`, `adb version`
- Flutter SDK — verify: `where flutter`, `flutter --version`
- Puro (optional) — observed path used here:
  - `C:\Users\Out_boxeR\AppData\Local\Microsoft\WinGet\Links\puro.exe`
  - Verify: `where puro`

If a command is missing, install the tool and add it to your PATH.

---

## License

Private/internal project for Vignan University placement management. Update terms as needed.

