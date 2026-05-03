-- ============================================================
-- STRIPE — Migrazione DB
-- Esegui in Supabase Dashboard > SQL Editor
-- ============================================================

-- Aggiunge stripe_customer_id al profilo utente
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Aggiunge colonne Stripe alle subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Permette lo stato 'disdetta' e 'pagamento_fallito' oltre ad 'attiva'/'annullata'
-- (se hai un constraint CHECK su stato, aggiornalo così)
-- ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stato_check;
-- ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_stato_check
--   CHECK (stato IN ('attiva', 'annullata', 'disdetta', 'pagamento_fallito'));

-- Indice per lookup veloce da webhook
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id
  ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles(stripe_customer_id);
