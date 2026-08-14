# Artisthive

A trusted artist ecosystem: community + marketplace + bookings, protected by artist verification and a protected-deal (escrow-like) workflow.

## Repo structure

```
Artisthive/
├── web/          React SPA (Vite) — public user app
├── admin/        React SPA (Vite) — admin panel
├── backend/      Node.js + Express + Prisma + Socket.IO
├── docs/         Schema, API spec, admin workflows
├── docker-compose.yml
├── Caddyfile
└── .env.example
```

## Stack

- **Frontend:** React + Vite (`web/`), admin panel (`admin/`)
- **Backend:** Node.js + Express + Prisma
- **DB:** PostgreSQL
- **Auth:** SuperTokens (self-hosted) — email/password + email OTP
- **Email:** Resend / Brevo (transactional API for OTP delivery)
- **Realtime:** Socket.IO (chat), REST for history/pagination
- **Media:** local disk on VPS + static serving
- **Deploy:** Docker Compose + Caddy (HTTPS)

## Local development

1. Copy `.env.example` to `.env`
2. Start infra: `docker compose up -d postgres supertokens` (or use a local PostgreSQL)
3. Backend: `cd backend && npm install && npx prisma migrate dev && npm run dev`
4. Web: `cd web && npm install && npm run dev`
5. Admin: `cd admin && npm install && npm run dev`

## Docs

See `docs/` for schema, API spec, and admin workflow specifications.

## Prototype scope

Protected transactions simulate the escrow workflow (demo payment states only — no real money movement). See the Technical Blueprint PDF in the repo root.
