ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at timestamp;
ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

UPDATE users SET phone = regexp_replace(phone, '[\s\-\(\)]', '', 'g')
WHERE phone IS NOT NULL;

UPDATE users SET phone = CASE
  WHEN phone ~ '^\+374\d{8}$' THEN phone
  WHEN phone ~ '^00374\d{8}$' THEN '+' || substring(phone from 3)
  WHEN phone ~ '^374\d{8}$' THEN '+' || phone
  WHEN phone ~ '^0\d{8}$' THEN '+374' || substring(phone from 2)
  WHEN phone ~ '^\d{8}$' AND substring(phone from 1 for 2) IN ('10','11','12','33','41','43','44','55','77','91','93','94','95','96','97','98','99') THEN '+374' || phone
  ELSE NULL
END
WHERE phone IS NOT NULL;

UPDATE users u SET phone = NULL
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY phone ORDER BY last_login_at DESC NULLS LAST, created_at DESC
  ) AS rn
  FROM users WHERE phone IS NOT NULL
) dups
WHERE u.id = dups.id AND dups.rn > 1;

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users ADD CONSTRAINT users_phone_e164_check
    CHECK (phone IS NULL OR phone ~ '^\+374\d{8}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS phone_otp_codes (
  id serial PRIMARY KEY,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamp NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  invalidated boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_daily_stats (
  id serial PRIMARY KEY,
  date text NOT NULL UNIQUE,
  count integer DEFAULT 0 NOT NULL,
  total_cost real DEFAULT 0 NOT NULL
);
