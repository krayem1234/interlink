-- Week 3: First-login password change + security questions

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS security_questions_configured BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing accounts keep their current password
UPDATE users
SET must_change_password = FALSE
WHERE must_change_password = TRUE;

CREATE TABLE IF NOT EXISTS auth_security_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  position SMALLINT NOT NULL CHECK (position IN (1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, position)
);

CREATE INDEX IF NOT EXISTS idx_auth_security_questions_user_id
  ON auth_security_questions(user_id);
