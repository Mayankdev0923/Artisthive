# Local Testing Guide (Laptop)

Run the whole platform on one machine for development. You need **three terminals** (one per service) plus SuperTokens running.

## Prerequisites

- Node.js 18+ (we use 22)
- PostgreSQL running locally (v13+)
- Docker Desktop **or** a native SuperTokens core install

## 1. Database

If you're on a fresh machine, create the databases and user:

```sql
-- connect as postgres
CREATE USER artisthive WITH PASSWORD 'artisthive';
CREATE DATABASE artisthive OWNER artisthive;
CREATE DATABASE supertokens OWNER artisthive;
```

The backend reads its connection string from `backend/.env`:

```
DATABASE_URL=postgresql://artisthive:artisthive@localhost:5432/artisthive?schema=public
```

## 2. SuperTokens core

The auth server must be running on port **3567**. Two options:

### Option A — Docker (recommended)

```bash
# In the repo root, start only the auth core (local Postgres is reused via host.docker.internal)
docker run -d --name artisthive-st \
  -p 3567:3567 \
  -e POSTGRESQL_CONNECTION_URI="postgresql://artisthive:artisthive@host.docker.internal:5432/supertokens" \
  supertokens/supertokens-postgresql:11.4
```

Verify: open `http://localhost:3567/hello` → should say `Hello`.

### Option B — Native binary (no Docker)

1. Download the **Windows + PostgreSQL** binary from <https://supertokens.com/use-oss>
2. Unzip, run `install.bat` as **Administrator**
3. Edit `config.yaml` (path shown by `supertokens --help`) and set:

   ```yaml
   postgresql_connection_uri: "postgresql://artisthive:artisthive@localhost:5432/supertokens"
   ```

4. Start: `supertokens start --foreground`

## 3. Start the backend

```bash
cd backend
npm install
npx prisma migrate deploy      # apply migrations to local DB
npm run db:seed                # demo admin/artist/buyer data (optional)
npm run dev                    # http://localhost:4000
```

Smoke test: `http://localhost:4000/health` → `{"status":"ok"}`

## 4. Start the web app

```bash
cd web
npm install
npm run dev                    # http://localhost:5173
```

## 5. Start the admin panel

```bash
cd admin
npm install
npm run dev                    # http://localhost:5174
```

## 6. What to test

| Flow | Where | Steps |
|---|---|---|
| Sign up / sign in | `http://localhost:5173/auth` | Email + password (email OTP also configured) |
| Feed | Home | Post a message, see it appear |
| Become an artist | `/apply` | Submit → note the `AV-XXXXX` code |
| Verify an artist | `http://localhost:5174/artists` | Login as admin, approve/reject |
| Verified artist badge | Artist profile | Shows `Verified ✓` after approval |
| Protected deal | Buyer creates order → demo-pay → evidence → admin reviews | See order statuses change |
| Chat | `/chat` | Realtime via Socket.IO |
| Admin queue/audit | `/admin` sidebar | Artist verification, orders, disputes, reports, audit logs |

### Demo seed accounts (from `npm run db:seed`)

- `admin@artisthive.test` — role ADMIN
- `artist@artisthive.test` — verified artist
- `buyer@artisthive.test` — normal user

> These are local DB rows only. To sign in as them you must first register the same email through the SuperTokens UI (any password) — the local user row is then linked.

## Ports

| Service | URL |
|---|---|
| Web app | http://localhost:5173 |
| Admin panel | http://localhost:5174 |
| Backend API | http://localhost:4000 |
| SuperTokens core | http://localhost:3567 |

## Notes

- `backend/.env` is gitignored; copy from `.env.example` if missing.
- OTP emails are logged to the backend console in development (no Resend/Brevo key needed).
- Media uploads go to `backend/media/` and are served at `http://localhost:4000/media/...`.