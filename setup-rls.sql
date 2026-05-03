-- ============================================================
-- SHOP YOUR AGENT — RLS Setup
-- Esegui questo script in Supabase Dashboard > SQL Editor
-- DOPO averlo eseguito, la service_role key non serve più.
-- ============================================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- NOTA SICUREZZA: il ruolo "admin" viene letto da app_metadata
-- (non da user_metadata, che l'utente può modificare da solo).
-- Per assegnare il ruolo admin a un utente, esegui:
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'
--   WHERE id = '<uuid-utente>';
-- ============================================================

-- Helper per check admin (usa app_metadata, non modificabile dagli utenti)
-- (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- ============================================================
-- PROFILES
-- ============================================================
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- VENDORS
-- ============================================================
DROP POLICY IF EXISTS "vendors_select" ON vendors;
DROP POLICY IF EXISTS "vendors_insert" ON vendors;
DROP POLICY IF EXISTS "vendors_update" ON vendors;

CREATE POLICY "vendors_select" ON vendors
  FOR SELECT USING (
    approvato = true
    OR auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "vendors_insert" ON vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vendors_update" ON vendors
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- AGENTS
-- ============================================================
DROP POLICY IF EXISTS "agents_select" ON agents;
DROP POLICY IF EXISTS "agents_insert" ON agents;
DROP POLICY IF EXISTS "agents_update" ON agents;
DROP POLICY IF EXISTS "agents_delete" ON agents;

CREATE POLICY "agents_select" ON agents
  FOR SELECT USING (
    attivo = true
    OR vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "agents_insert" ON agents
  FOR INSERT WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid() AND approvato = true
    )
  );

CREATE POLICY "agents_update" ON agents
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "agents_delete" ON agents
  FOR DELETE USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;

CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR agent_id IN (
      SELECT a.id FROM agents a
      JOIN vendors v ON a.vendor_id = v.id
      WHERE v.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "subscriptions_insert" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update" ON subscriptions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
