-- Week 2: Auth support tables (refresh tokens + OTP)

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_id
  ON auth_refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expires_at
  ON auth_refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS auth_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose VARCHAR(50) NOT NULL,
  otp_hash TEXT NOT NULL,
  consumed BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_otps_user_purpose
  ON auth_otps(user_id, purpose);

CREATE INDEX IF NOT EXISTS idx_auth_otps_expires_at
  ON auth_otps(expires_at);
