# InternLink - Week 1 Setup

This repository contains the week-1 baseline for InternLink.

## Delivered in week 1

- Monorepo structure for frontend, backend microservices, and infra.
- Backend architecture with API Gateway and service placeholders.
- Frontend Angular-like structure with module folders and initial UI mockup screen.
- Docker Compose with PostgreSQL, pgAdmin, gateway, and all core services.
- PostgreSQL initial schema and entity relationship notes.
- Technical architecture and sprint documentation.

## Delivered in week 2

- Auth Service complete flow: register, login, JWT, refresh token.
- Forgot password with OTP generation, verification, and password reset.
- API Gateway routing for all auth endpoints under `/api/auth/*`.
- PostgreSQL auth tables for refresh tokens and OTPs.

## Project structure

```text
stage4/
  frontend/
  backend/
  infra/
  docs/
```

## Quick start

1. Copy environment variables:

```powershell
Copy-Item .env.example .env
```

2. Start infrastructure and services:

```powershell
docker compose up -d --build
```

3. Open PostgreSQL admin:

- URL: http://localhost:5050
- Email: admin@internlink.localhost.com
- Password: admin123

## Important docs

- `docs/ARCHITECTURE.md` - microservices design and communication.
- `docs/WEEK1_SUMMARY.md` - completed tasks for week 1.
- `docs/WEEK2_SUMMARY.md` - completed tasks for week 2.
- `infra/db/migrations/001_init.sql` - initial PostgreSQL schema.
- `infra/db/migrations/002_auth.sql` - auth-specific schema additions.

## Next recommended step

Implement week 3: student profile CRUD and CV metadata management.
