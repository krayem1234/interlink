# Week 2 - Auth Service Delivery

## Scope completed

1. Auth Service endpoints implemented:
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/forgot-password/request-otp
   - POST /auth/forgot-password/verify-otp
   - POST /auth/forgot-password/reset
2. JWT access token and refresh token flow implemented.
3. Refresh token persistence and revocation implemented in PostgreSQL.
4. OTP password reset flow implemented with PostgreSQL storage.
5. API Gateway integration for all auth endpoints under /api/auth/*.
6. Environment variables and DB migration for auth tables added.

## API examples

### Register
POST /api/auth/register
{
  "email": "student1@internlink.local",
  "password": "StrongPass123",
  "role": "STUDENT"
}

### Login
POST /api/auth/login
{
  "email": "student1@internlink.local",
  "password": "StrongPass123"
}

### Refresh
POST /api/auth/refresh
{
  "refreshToken": "<token>"
}

### Forgot password (request OTP)
POST /api/auth/forgot-password/request-otp
{
  "email": "student1@internlink.local"
}

In non-production mode, response includes devOtp to simplify testing.

### Verify OTP
POST /api/auth/forgot-password/verify-otp
{
  "email": "student1@internlink.local",
  "otp": "123456"
}

### Reset password
POST /api/auth/forgot-password/reset
{
  "email": "student1@internlink.local",
  "otp": "123456",
  "newPassword": "NewStrongPass123"
}

## Notes

- Token signing defaults to development secrets if env vars are absent.
- Notification Service email sending is intentionally deferred to a later week.
