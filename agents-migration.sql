-- ============================================================
-- SHOP YOUR AGENT — Migrazione agenti v2
-- Esegui in Supabase Dashboard > SQL Editor
-- ============================================================

-- Aggiunge il campo "stack tecnologico" agli agenti
-- (libero testo: es. "N8N", "Make", "Zapier", "API Custom", "GPT-4", ecc.)
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS tipo_tecnologia TEXT;

-- Vincolo di unicità su stripe_subscription_id per garantire idempotenza del webhook
-- (previene abbonamenti duplicati in caso di doppia consegna dell'evento Stripe)
ALTER TABLE subscriptions
  ADD CONSTRAINT IF NOT EXISTS subscriptions_stripe_sub_id_unique
  UNIQUE (stripe_subscription_id);
