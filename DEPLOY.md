# Deploy Guide — Everything on Render

This deploys the **database, backend, and frontend all on Render** using the
`render.yaml` blueprint at the repo root. Three services get created:

| Service | Type | What it runs |
|---|---|---|
| `qr-attendance-mongo` | Private service | MongoDB (Docker image), persistent disk |
| `qr-attendance-backend` | Web service | Express API (`backend/Dockerfile`) |
| `qr-attendance-frontend` | Web service | Next.js app (`frontend/Dockerfile`) |

> **Note on cost:** persistent disks (needed for MongoDB to actually keep
> your data) are **not available on Render's free tier** — the `mongo`
> service needs at least the `starter` plan (~$7/mo as of writing). The two
> web services can run on free/starter too. If you want $0 hosting instead,
> use MongoDB Atlas's free M0 cluster for the database and only host
> backend + frontend on Render — see the "cheaper alternative" note at the
> bottom.

---

## 1. Push to GitHub
```bash
cd qr-attendance
git init
git add .
git commit -m "QR attendance system"
git branch -M main
git remote add origin https://github.com/<you>/qr-attendance.git
git push -u origin main
```

---

## 2. Deploy the blueprint
1. Go to **render.com → New → Blueprint**.
2. Connect the GitHub repo you just pushed. Render reads `render.yaml` at
   the root and shows all three services it will create.
3. Click **Apply**. Render provisions `qr-attendance-mongo` first (give it
   a minute — private services with disks take slightly longer to spin up).

Two env vars are marked `sync: false` in the blueprint, meaning Render will
prompt you to fill them in during setup (or you set them right after,
in each service's **Environment** tab):

- On **qr-attendance-frontend**: `NEXT_PUBLIC_API_URL`
- On **qr-attendance-backend**: `FRONTEND_URL`, and optionally the `SMTP_*` vars

Since these two depend on each other's URLs, do it in this order:

---

## 3. First deploy — leave the cross-links blank
Let the blueprint apply with `NEXT_PUBLIC_API_URL` and `FRONTEND_URL` left
empty for now. Both services will build and deploy successfully (they just
won't be able to talk to each other yet).

---

## 4. Grab the two public URLs
Once deployed, Render shows each web service's URL at the top of its page:
- Backend: `https://qr-attendance-backend.onrender.com`
- Frontend: `https://qr-attendance-frontend.onrender.com`

(Exact subdomain depends on availability — Render may add a suffix if the
name is taken.)

---

## 5. Wire the frontend → backend
Go to **qr-attendance-frontend → Environment**:
```
NEXT_PUBLIC_API_URL=https://qr-attendance-backend.onrender.com/api
```
Save. Because this value is baked in at **build time** (Next.js requirement
for `NEXT_PUBLIC_*` vars), Render will trigger a rebuild — wait for it to
finish.

---

## 6. Wire the backend → frontend (CORS)
Go to **qr-attendance-backend → Environment**:
```
FRONTEND_URL=https://qr-attendance-frontend.onrender.com
```
Save — this redeploys the backend and updates its CORS allow-list to accept
requests from your frontend's origin.

---

## 7. Confirm the database connection
`MONGO_URI` is already set in `render.yaml` to
`mongodb://qr-attendance-mongo:27017/qr_attendance` — Render's private
networking resolves `qr-attendance-mongo` to the Mongo service automatically
since they're in the same project/region. Check the backend's **Logs** tab
for `MongoDB connected` on startup. If you see a connection error, confirm
both services are in the same `region` (both default to `oregon` in the
blueprint).

---

## 8. Bootstrap the first admin
```bash
curl -X POST https://qr-attendance-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"admin123","role":"admin"}'
```
Then open `https://qr-attendance-frontend.onrender.com/login` and sign in.

---

## 9. Set your real office coordinates
On **qr-attendance-backend → Environment**, update:
```
OFFICE_LAT=<your latitude>
OFFICE_LNG=<your longitude>
OFFICE_RADIUS_METERS=200
```
(Right-click your office on Google Maps to get exact lat/lng.)

---

## Health check
```bash
curl https://qr-attendance-backend.onrender.com/api/health
# {"status":"ok","time":"..."}
```

## Cold starts
On Render's `starter` plan services don't sleep, so this should stay warm.
If you drop any service to the free tier, expect a ~30–60s cold start on
the first request after inactivity — the login page will just hang briefly.

---

## Cheaper alternative: Render (app) + Atlas (DB, free)
If you'd rather not pay for a Mongo disk on Render, skip the
`qr-attendance-mongo` service entirely:
1. Delete that block from `render.yaml` (or just don't apply that service).
2. Create a free M0 cluster at atlas.mongodb.com, get its connection string.
3. On `qr-attendance-backend → Environment`, set `MONGO_URI` to the Atlas
   string instead of the internal one.
Everything else in this guide (steps 1, 3–9) stays identical.
