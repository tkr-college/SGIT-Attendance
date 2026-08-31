# Deploy Guide — Everything on Railway

Railway doesn't support one root-level blueprint file the way Render does,
but the flow is just as fast: **one project with three services** — a
managed MongoDB, the backend, and the frontend. This repo includes
`backend/railway.json` and `frontend/railway.json` so each service builds
correctly from its own Dockerfile once you point Railway at that folder.

| Service | Source | Config used |
|---|---|---|
| MongoDB | Railway's built-in MongoDB template (no Dockerfile needed) | — |
| Backend | `backend/` folder | `backend/railway.json` + `backend/Dockerfile` |
| Frontend | `frontend/` folder | `frontend/railway.json` + `frontend/Dockerfile` |

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

## 2. Create the project + database
1. Go to **railway.app → New Project**.
2. Choose **Provision MongoDB** (Railway's own template) — this creates a
   managed Mongo instance in your project with no Dockerfile required.
3. Once it's up, open the Mongo service → **Variables** tab → copy the
   `MONGO_URL` (or `MONGO_PUBLIC_URL`) value. You'll paste this into the
   backend in step 4.

---

## 3. Add the backend service
1. In the same project: **New → GitHub Repo** → select your repo.
2. Railway will ask for a root directory / build config — set:
   - **Root Directory:** `backend`
3. Railway detects `backend/railway.json` and `backend/Dockerfile`
   automatically and builds with Docker.
4. Go to the new service's **Variables** tab and add everything from
   `backend/.env.example`, at minimum:
   ```
   MONGO_URI=<the MONGO_URL you copied in step 2>
   JWT_SECRET=<generate a random string>
   QR_SECRET=<generate a different random string>
   JWT_EXPIRES_IN=8h
   QR_TOKEN_TTL_MINUTES=60
   OFFICE_LAT=17.4239
   OFFICE_LNG=78.5480
   OFFICE_RADIUS_METERS=200
   CHECKIN_START=10:00
   CHECKIN_LATE_AFTER=10:20
   CHECKOUT_START=17:30
   CHECKOUT_END=18:30
   ```
   Leave `FRONTEND_URL` blank for now — you'll set it in step 6.
5. **Settings → Networking → Generate Domain** to get a public URL, e.g.
   `https://qr-attendance-backend-production.up.railway.app`.

---

## 4. Confirm the backend is healthy
```bash
curl https://qr-attendance-backend-production.up.railway.app/api/health
# {"status":"ok","time":"..."}
```
If this fails, check the service's **Deploy Logs** — most common cause is
`MONGO_URI` not set or pointing at the wrong host.

---

## 5. Add the frontend service
1. In the same project: **New → GitHub Repo** → same repo again.
2. Set **Root Directory:** `frontend`.
3. Railway detects `frontend/railway.json` and `frontend/Dockerfile`.
4. Go to **Variables** and add:
   ```
   NEXT_PUBLIC_API_URL=https://qr-attendance-backend-production.up.railway.app/api
   ```
   This must be set **before the first build** — Next.js bakes
   `NEXT_PUBLIC_*` vars in at build time (the Dockerfile already declares
   `ARG NEXT_PUBLIC_API_URL`, and Railway automatically passes service
   variables through as Docker build args).
5. **Settings → Networking → Generate Domain** to get the frontend's public
   URL, e.g. `https://qr-attendance-frontend-production.up.railway.app`.

---

## 6. Wire the backend's CORS to the frontend
Go back to the **backend** service → **Variables**:
```
FRONTEND_URL=https://qr-attendance-frontend-production.up.railway.app
```
Save — Railway redeploys the backend automatically.

---

## 7. Bootstrap the first admin
```bash
curl -X POST https://qr-attendance-backend-production.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@company.com","password":"admin123","role":"admin"}'
```
Then open `https://qr-attendance-frontend-production.up.railway.app/login`.

---

## 8. Set your real office coordinates
On the backend service → **Variables**:
```
OFFICE_LAT=<your latitude>
OFFICE_LNG=<your longitude>
OFFICE_RADIUS_METERS=200
```
(Right-click your office on Google Maps to get exact lat/lng.)

---

## Notes
- **Pricing:** Railway gives ~$5/month of free usage, then bills per
  resource consumed (no hard free tier like Render's, but no forced
  cold-starts either — services stay warm as long as you're within budget).
- **Custom domains:** each service's **Settings → Networking** lets you
  attach your own domain instead of the `*.up.railway.app` one, with a CNAME.
- **Redeploys:** every `git push` to your connected branch auto-redeploys
  the affected service(s).
- **Rotating secrets:** if you ever regenerate `JWT_SECRET`, all existing
  logins are invalidated — fine for setup, just be aware before doing it in
  production with active users.
