-- ============================================================
-- Bangla-Chain ERP — SR Company Synchronization & Data Integrity Migration
-- ============================================================
-- Single Source of Truth: The existing DMS tables remain the authoritative master.
-- This migration enhances existing tables with company relationships and integrity checks.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- 1. COMPANIES: Add is_active column if not present
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────
-- 2. SRS (Sales Representatives): Company & Route Association
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS srs ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE IF EXISTS srs ADD COLUMN IF NOT EXISTS assigned_route_id TEXT;
ALTER TABLE IF EXISTS srs ADD COLUMN IF NOT EXISTS employee_id TEXT DEFAULT '';
ALTER TABLE IF EXISTS srs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────
-- 3. ROUTES: Add company_id reference
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS routes ADD COLUMN IF NOT EXISTS company_id TEXT;

-- ─────────────────────────────────────────────
-- 4. CUSTOMERS (Retailers): Company & Status
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS assigned_sr_id TEXT;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────
-- 5. CHALLANS (Orders / Dispatches): Company ID
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS challans ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE IF EXISTS challans ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- ─────────────────────────────────────────────
-- 6. SR COLLECTIONS: Company & Customer references
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS sr_collections ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE IF EXISTS sr_collections ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- ─────────────────────────────────────────────
-- 7. SR TARGETS: Ensure company columns exist
-- ─────────────────────────────────────────────
ALTER TABLE IF EXISTS sr_targets ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT '';
ALTER TABLE IF EXISTS sr_targets ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '';

-- ─────────────────────────────────────────────
-- 8. COMPOSITE INDEXES FOR PERFORMANCE & COMPANY ISOLATION
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_srs_owner_company ON srs (owner_id, company_id);
CREATE INDEX IF NOT EXISTS idx_routes_owner_company ON routes (owner_id, company_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_company ON customers (owner_id, company_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_sr ON customers (owner_id, assigned_sr);
CREATE INDEX IF NOT EXISTS idx_challans_owner_company ON challans (owner_id, company);
CREATE INDEX IF NOT EXISTS idx_challans_owner_sr_company ON challans (owner_id, sr_name, company);
CREATE INDEX IF NOT EXISTS idx_sr_collections_owner_sr ON sr_collections (owner_id, sr_id);
CREATE INDEX IF NOT EXISTS idx_sr_targets_owner_sr_month ON sr_targets (owner_id, sr_id, month);

-- ─────────────────────────────────────────────
-- 9. ATOMIC COLLECTION RECORDING RPC
-- process_sr_collection()
-- Records collection, updates customer due, and writes to customer_payments
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_sr_collection(
  p_collection_id TEXT,
  p_owner_id      UUID,
  p_sr_id         TEXT,
  p_sr_name       TEXT,
  p_challan_id    TEXT,
  p_customer_name TEXT,
  p_customer_id   TEXT,
  p_amount        NUMERIC,
  p_payment_method TEXT,
  p_company_id    TEXT DEFAULT '',
  p_notes         TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_challan RECORD;
  v_current_due NUMERIC := 0;
  v_new_due NUMERIC := 0;
BEGIN
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_AMOUNT', 'message', 'Collection amount must be greater than zero.');
  END IF;

  -- 1. Insert into sr_collections
  INSERT INTO sr_collections (
    id, owner_id, sr_id, sr_name, challan_id, customer_name, customer_id,
    company_id, amount, payment_method, notes, collected_at, created_at
  ) VALUES (
    p_collection_id, p_owner_id, p_sr_id, p_sr_name, p_challan_id, p_customer_name, p_customer_id,
    p_company_id, p_amount, p_payment_method, p_notes, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    amount = p_amount,
    payment_method = p_payment_method,
    notes = p_notes;

  -- 2. Update Customer Due balance if customer_id or customer_name matches
  IF p_customer_id IS NOT NULL AND p_customer_id != '' THEN
    UPDATE customers
    SET
      due = GREATEST(0, COALESCE(due, 0) - p_amount),
      total_paid = COALESCE(total_paid, 0) + p_amount
    WHERE id = p_customer_id AND owner_id = p_owner_id
    RETURNING due INTO v_new_due;

    -- Also record into customer_payments ledger
    INSERT INTO customer_payments (
      id, owner_id, customer_id, amount, payment_date,
      payment_mode, reference_no, notes, created_by, created_at
    ) VALUES (
      'PAY-' || p_collection_id, p_owner_id, p_customer_id, p_amount,
      CURRENT_DATE::TEXT, p_payment_method, p_challan_id,
      'Field Collection by SR: ' || p_sr_name || CASE WHEN p_notes != '' THEN ' (' || p_notes || ')' ELSE '' END,
      p_sr_name, NOW()
    );
  ELSIF p_customer_name IS NOT NULL AND p_customer_name != '' THEN
    UPDATE customers
    SET
      due = GREATEST(0, COALESCE(due, 0) - p_amount),
      total_paid = COALESCE(total_paid, 0) + p_amount
    WHERE name = p_customer_name AND owner_id = p_owner_id
    RETURNING due INTO v_new_due;
  END IF;

  -- 3. Audit Log
  INSERT INTO audit_logs (owner_id, user_id, action, module, entity_type, entity_id, new_data)
  VALUES (
    p_owner_id, p_sr_id, 'SR_COLLECTION_RECORDED', 'Collection', 'sr_collection', p_collection_id,
    jsonb_build_object(
      'amount', p_amount,
      'challan_id', p_challan_id,
      'customer_name', p_customer_name,
      'payment_method', p_payment_method,
      'sr_name', p_sr_name
    )
  );

  RETURN jsonb_build_object('success', true, 'collection_id', p_collection_id, 'new_due', v_new_due);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', SQLERRM);
END;
$$;

COMMIT;
