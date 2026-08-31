# QR Attendance Tracking System

Full-stack employee attendance app: employees scan a rotating, signed QR code to
check in / check out; the backend enforces time windows and office geofencing;
admins get a live dashboard, employee management, and CSV export.

## Stack
- **Frontend:** Next.js (Pages Router) + Tailwind CSS + Axios + `html5-qrcode`
- **Backend:** Node.js + Express + JWT
- **Database:** MongoDB (Mongoose)
- **Infra:** Docker + docker-compose

## Folder structure
```
qr-attendance/
├── backend/
│   ├── config/db.js
│   ├── controllers/        # auth, employee, attendance, admin
│   ├── middleware/auth.js  # JWT protect + adminOnly
│   ├── models/              # Employee, Attendance
│   ├── routes/
│   ├── utils/                # qrToken, geo, timeRules
│   ├── server.js
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── components/          # Layout (sidebar), StatusBadge
│   ├── lib/api.js            # axios instance + session helpers
│   ├── pages/
│   │   ├── login.js
│   │   ├── employee/ (index, qr, scan, history)
│   │   └── admin/ (index, employees, attendance)
│   ├── styles/globals.css
│   └── Dockerfile
└── docker-compose.yml
```

## How the QR + attendance rules work

1. **Dynamic QR ("no screenshot replay")** — `/api/employee/qr` issues a fresh
   JWT (`QR_SECRET`, TTL = `QR_TOKEN_TTL_MINUTES`) encoding the employee's
   `employeeCode`. The frontend re-fetches a new QR automatically once the
   current one expires, so a saved screenshot stops working after the TTL.
2. **Scan verification** — `POST /api/attendance/scan` requires the caller to
   be logged in (JWT in `Authorization` header) AND the scanned QR token must
   decode to that *same* employee's code — this stops employee A from
   checking in employee B by scanning their QR.
3. **Time rules** (`utils/timeRules.js`, configurable via `.env`):
   - Check-in 10:00–10:20 → `Present`; after 10:20 (until check-in closes at
     your discretion) → `Late`; before 10:00 → rejected.
   - Check-out allowed 17:30–18:30 only.
4. **Geofencing** (`utils/geo.js`) — every scan must include browser
   geolocation; the backend rejects scans outside `OFFICE_RADIUS_METERS` of
   `OFFICE_LAT`/`OFFICE_LNG`.
5. **Optional device lock** — first scan binds `deviceId` (a random id stored
   in `localStorage`) to the employee; later scans from a different device
   are rejected. Admins can unlock a device from the Employees page.
6. **Absentee sweep** — a nightly cron (`node-cron`, 11 PM) inserts an
   `Absent` record for any active employee with no attendance row that day.

## Database schema

**Employee**
| field | type |
|---|---|
| name | String |
| email | String (unique) |
| password | String (bcrypt hash) |
| role | 'admin' \| 'employee' |
| employeeCode | String (unique, encoded in QR) |
| deviceId | String \| null |
| isActive | Boolean |

**Attendance** (one document per employee per day)
| field | type |
|---|---|
| employee | ObjectId ref Employee |
| date | String `YYYY-MM-DD` |
| checkInTime / checkOutTime | Date \| null |
| status | Present \| Late \| Absent \| Incomplete |
| checkInLocation / checkOutLocation | { lat, lng } |

## API endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | public* | create account (first admin bootstraps) |
| POST | /api/auth/login | public | returns JWT + user |
| GET | /api/employee/me | employee | current profile |
| GET | /api/employee/qr | employee | fresh signed QR (base64 PNG) |
| GET | /api/employee/my-attendance | employee | own history (`?from=&to=`) |
| POST | /api/attendance/scan | employee | body `{qrToken, action, lat, lng, deviceId}` |
| GET | /api/attendance | admin | all logs (`?date=&from=&to=&employeeId=`) |
| GET | /api/admin/dashboard | admin | today's stats (`?date=`) |
| POST | /api/admin/employees | admin | create employee |
| PUT | /api/admin/employees/:id | admin | update / deactivate / unlock device |
| DELETE | /api/admin/employees/:id | admin | delete |
| GET | /api/admin/export | admin | CSV download (`?from=&to=`) |

\* `register` only allows `role: admin` if no admin exists yet — use it once
to bootstrap, then create further employees via `/api/admin/employees`.

## Setup (local, no Docker)

**Backend**
```bash
cd backend
cp .env.example .env      # edit MONGO_URI, JWT_SECRET, QR_SECRET, office coords
npm install
npm run dev                # http://localhost:5000
```

**Frontend**
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                # http://localhost:3000
```

**Bootstrap the first admin**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"admin123","role":"admin"}'
```
Log in at `http://localhost:3000/login` with that email/password.

## Setup (Docker)
```bash
cp backend/.env.example backend/.env   # fill in secrets/coordinates
docker compose up --build
```
Frontend on `:3000`, backend on `:5000`, MongoDB on `:27017`.

## API testing guide (curl)

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}'
# -> copy the "token"

# 2. Create an employee (as admin)
curl -X POST http://localhost:5000/api/admin/employees \
  -H "Authorization: Bearer <ADMIN_TOKEN>" -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@company.com","password":"pass1234"}'

# 3. Employee logs in, then fetches a QR token
curl http://localhost:5000/api/employee/qr -H "Authorization: Bearer <EMP_TOKEN>"
# -> qrDataUrl is a base64 PNG; the raw signed JWT is the QR payload

# 4. Employee scans (self-service, e.g. from a kiosk displaying their own QR)
curl -X POST http://localhost:5000/api/attendance/scan \
  -H "Authorization: Bearer <EMP_TOKEN>" -H "Content-Type: application/json" \
  -d '{"qrToken":"<TOKEN_FROM_QR>","action":"check-in","lat":17.4239,"lng":78.5480}'

# 5. Admin dashboard
curl http://localhost:5000/api/admin/dashboard -H "Authorization: Bearer <ADMIN_TOKEN>"

# 6. Export CSV
curl "http://localhost:5000/api/admin/export?from=2026-08-01&to=2026-08-31" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" -o attendance.csv
```

## Deployment

- **Frontend → Vercel:** import `frontend/` as the project root, set env var
  `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api`.
- **Backend → Render/Railway:** deploy `backend/` (Dockerfile provided or use
  their Node buildpack), set all vars from `.env.example` in the dashboard.
- **Database → MongoDB Atlas:** create a free cluster, whitelist your
  backend's egress IP (or `0.0.0.0/0` for quick testing), use the connection
  string as `MONGO_URI`.
- Update CORS: set `FRONTEND_URL` on the backend to your deployed frontend
  origin.

## Notes / extension points (kept lightweight in this build)
- **Email notifications / daily summary:** `nodemailer` is wired into
  `package.json`; add a small mailer util and call it from
  `attendanceController.scan` (on `Late`) and from the cron job in
  `server.js` for a daily digest.
- **PDF export:** CSV export is implemented; for PDF, pipe the same rows
  through a library like `pdfkit` in `adminController.exportAttendance`.
- **Dark mode:** implemented via Tailwind `darkMode: 'class'` + a toggle in
  the sidebar, persisted in `localStorage`.
