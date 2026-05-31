-- ============================================================
-- SHOP YOUR AGENT — Migrazione vendor v2
-- Esegui in Supabase Dashboard > SQL Editor
-- ============================================================

-- Verifica identità via email
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS email_verificata BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Dati fiscali / aziendali
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS partita_iva TEXT,
  ADD COLUMN IF NOT EXISTS nome_azienda TEXT;

-- Tracciamento pagamento mensile vendor
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS ultimo_pagamento DATE,
  ADD COLUMN IF NOT EXISTS note_admin TEXT;

-- Indice per lookup token
CREATE INDEX IF NOT EXISTS idx_vendors_verification_token
  ON vendors(verification_token)
  WHERE verification_token IS NOT NULL;
