ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_verified_wallet_unique ON users (lower(wallet_address)) WHERE wallet_address IS NOT NULL;

CREATE TABLE IF NOT EXISTS wallet_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('login', 'link')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS wallet_challenges_expiry ON wallet_challenges(expires_at);

CREATE TABLE IF NOT EXISTS billing_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro','vip')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly','yearly')),
  method TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_decimals INTEGER NOT NULL,
  payer_address TEXT NOT NULL,
  treasury_address TEXT NOT NULL,
  amount_usd NUMERIC(12,2) NOT NULL,
  amount_units TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  required_confirmations INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  confirmed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS billing_intents_user ON billing_intents(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS verified_payments (
  chain_id INTEGER NOT NULL,
  tx_hash TEXT NOT NULL,
  intent_id UUID UNIQUE NOT NULL REFERENCES billing_intents(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_units TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(chain_id,tx_hash)
);
CREATE TABLE IF NOT EXISTS client_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  suffix TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS client_api_keys_user ON client_api_keys(user_id);
CREATE TABLE IF NOT EXISTS subscription_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('pro','vip')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  CHECK(ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS subscription_grants_active ON subscription_grants(user_id,ends_at);
CREATE TABLE IF NOT EXISTS cryptox_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
-- Preserve existing paid accounts without declaring historical payments verified.
INSERT INTO subscription_grants(source_id,user_id,tier,starts_at,ends_at)
SELECT 'legacy:' || id, id, tier, NOW(), tier_expires_at FROM users
WHERE tier IN ('pro','vip') AND tier_expires_at > NOW()
AND NOT EXISTS(SELECT 1 FROM cryptox_schema_migrations WHERE version='002_verified_billing')
ON CONFLICT(source_id) DO NOTHING;
INSERT INTO cryptox_schema_migrations(version) VALUES ('002_verified_billing') ON CONFLICT DO NOTHING;
-- Compatibility only: historical rows are never accepted as new verified payments.
CREATE TABLE IF NOT EXISTS crypto_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL, amount_usd NUMERIC, crypto_amount NUMERIC, token TEXT, network TEXT,
  tx_hash TEXT, status TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), confirmed_at TIMESTAMPTZ
);
