# VPS Deployment Guide

Deploy Artisthive to your own VPS using Docker Compose + Caddy (auto HTTPS via Let's Encrypt).

## Prerequisites

- A VPS with Ubuntu 22.04+ (or Debian), 2 GB RAM minimum
- A domain pointed at the VPS IP, e.g.:
  - `artisthive.yourdomain.com` → VPS IP (web app)
  - `admin.artisthive.yourdomain.com` → VPS IP (admin panel)
  - `api.artisthive.yourdomain.com` → VPS IP (API)
- SSH access

## 1. Install Docker on the VPS

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker
docker compose version   # should print v2.x
```

Add your user to the docker group (log out/in after):
```bash
sudo usermod -aG docker $USER
```

## 2. Clone the repo

```bash
cd /opt
sudo git clone https://github.com/Mayankdev0923/Artisthive.git
sudo chown -R $USER:$USER /opt/Artisthive
cd Artisthive
```

## 3. Configure environment

```bash
cp .env.example .env
nano .env
```

Set the production values:

```
WEB_DOMAIN=https://artisthive.yourdomain.com
ADMIN_DOMAIN=https://admin.artisthive.yourdomain.com
API_DOMAIN=https://api.artisthive.yourdomain.com

POSTGRES_PASSWORD=<strong-password>

SUPERTOKENS_API_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

EMAIL_API_PROVIDER=resend
RESEND_API_KEY=<your-resend-key>      # or use brevo
OTP_EMAIL_FROM=Artisthive <no-reply@yourdomain.com>
```

## 4. Start the stack

```bash
docker compose up -d --build
```

Wait for containers to become healthy, then check status:

```bash
docker compose ps
```

First boot runs `prisma migrate deploy` (inside the backend container) to create the schema. Verify with:

```bash
docker compose exec backend node -e "console.log('ok')"
curl https://api.artisthive.yourdomain.com/health   # {"status":"ok"}
curl http://localhost:3567/hello                     # Hello
```

## 5. Create the admin user

There's no signup gating on roles yet, so promote an account to ADMIN:

```bash
docker compose exec backend sh -c "psql \$DATABASE_URL -c \"UPDATE users SET role='ADMIN' WHERE email='you@example.com'\""
```

Then sign up with that email through the web app (`WEB_DOMAIN/auth`) — the local user row gets linked, and admin rights apply.

## 6. Post-deploy

- **Seed data (optional):**
  ```bash
  docker compose exec backend node prisma/seed.js
  ```
- **Migrations** run automatically on container start. For manual runs:
  ```bash
  docker compose exec backend npx prisma migrate deploy
  ```
- **Media** is stored in the `media` Docker volume and served at `{API_DOMAIN}/media/...`.
- **Logs:**
  ```bash
  docker compose logs -f backend
  ```

## Updating

```bash
git pull
docker compose up -d --build
```

## Backups

Back up the Postgres volume (stop-free dump):

```bash
docker compose exec -T postgres pg_dump -U artisthive artisthive > backup_$(date +%F).sql
```

Restore:

```bash
cat backup_2026-01-01.sql | docker compose exec -T postgres psql -U artisthive artisthive
```

## Ports (defaults, if you keep `ports:` mapping)

| Service | Port |
|---|---|
| Caddy (HTTP/HTTPS) | 80 / 443 |
| Postgres | 5432 (consider removing the `ports:` mapping in prod to keep it internal) |
| SuperTokens | 3567 |
| Backend | 4000 |

> **Security note:** for production, remove the `ports:` block for `postgres`, `supertokens`, and `backend` and only expose them inside the Docker network. Caddy is the only service that should be publicly reachable. Keep `ports:` only if you need direct access (e.g. testing).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `docker compose up` fails to build | Ensure `.env` exists and `*.lock` files are committed; run `docker compose build --no-cache` |
| Backend can't reach Postgres | Check `docker compose logs backend`; confirm postgres is healthy (`docker compose ps`) |
| Caddy can't get a cert | Ensure DNS records point to the VPS and port 80/443 are open in the firewall |
| `prisma migrate deploy` fails | Run it manually: `docker compose exec backend npx prisma migrate deploy` |