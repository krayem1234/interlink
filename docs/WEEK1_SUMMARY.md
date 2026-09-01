# Week 1 - Delivery Summary

## Scope completed

1. Repository initialization with monorepo-style folder layout.
2. Angular frontend baseline with Material and first mockup page.
3. NestJS backend skeleton with API Gateway and 7 microservices.
4. Docker Compose orchestration for Postgres, pgAdmin, and services.
5. PostgreSQL initial schema design and migration script.
6. Architecture documentation and service routing map.

## Acceptance checklist

- [x] Frontend, backend, and infra folders created.
- [x] Microservices architecture documented and materialized.
- [x] PostgreSQL schema script available in infra/db/migrations.
- [x] Docker stack prepared for local startup.
- [x] Initial UI mockup available in Angular app.

## Runbook

```powershell
Copy-Item .env.example .env
docker compose up -d --build
```

## Notes for week 2

- Implement Auth Service endpoints and JWT strategy.
- Add shared response/error format in gateway.
- Add API contracts and Swagger bootstrap in gateway + auth.
