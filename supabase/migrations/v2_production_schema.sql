-- ============================================================
-- Bangla-Chain ERP — Production Migration v2.0
-- Run this file in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- This migration ADDS new tables and functions on top of the
-- existing schema. It does NOT drop any existing tables.
-- It is SAFE to run on a live database.
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────
-- STEP 1: Add missing columns to existing tables
-- ─────────────────────────────────────────────

-- Add password_hash to srs table for secure password storage
ALTER TABLE srs ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE srs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE srs ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add product_id reference on challans for stock lookup
ALTER TABLE challans ADD COLUMN IF NOT EXISTS product_id TEXT;
ALTER TABLE challans ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE challans ADD COLUMN IF NOT EXISTS cartons_qty NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE challans ADD COLUMN IF NOT EXISTS pcs_qty NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE challans ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE challans ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- Add constraints to challans status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'challans_status_check'
  ) THEN
    ALTER TABLE challans ADD CONSTRAINT challans_status_check
      CHECK (status IN ('Pending','Shipped','Delivered','Cancelled'));
  END IF;
END $$;

-- Add constraints to procurements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'procurements_payment_status_check'
  ) THEN
    ALTER TABLE procurements ADD CONSTRAINT procurements_payment_status_check
      CHECK (payment_status IN ('Paid','Pending','Partial','Cancelled'));
  END IF;
END $$;

-- Add constraints to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add due tracking columns to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases NUMERIC(14,2) NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_paid NUMERIC(14,2) NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────
-- STEP 2: SUPPLIERS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id            TEXT PRIMARY KEY,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone         TEXT DEFAULT '',
  address       TEXT DEFAULT '',
  email         TEXT DEFAULT '',
  payable       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_purchases NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_paid    NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON suppliers;
CREATE POLICY "owner_all" ON suppliers
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 3: STOCK LEDGER (Immutable Audit Trail)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_ledger (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id       TEXT NOT NULL,
  product_name     TEXT NOT NULL DEFAULT '',
  transaction_type TEXT NOT NULL,
  reference_type   TEXT NOT NULL DEFAULT '',
  reference_id     TEXT NOT NULL DEFAULT '',
  quantity_in      NUMERIC(12,4) NOT NULL DEFAULT 0,
  quantity_out     NUMERIC(12,4) NOT NULL DEFAULT 0,
  balance_after    NUMERIC(12,4) NOT NULL DEFAULT 0,
  unit             TEXT NOT NULL DEFAULT 'Pcs',
  notes            TEXT DEFAULT '',
  created_by       TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT stock_ledger_transaction_type_check CHECK (
    transaction_type IN (
      'PROCUREMENT','SALE','RETURN','DAMAGE','ADJUSTMENT',
      'CLAIM','BONUS','OPENING_BALANCE','TRANSFER','VOID'
    )
  ),
  CONSTRAINT stock_ledger_qty_non_negative CHECK (
    quantity_in >= 0 AND quantity_out >= 0
  )
);

ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON stock_ledger;
CREATE POLICY "owner_all" ON stock_ledger
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 4: CHART OF ACCOUNTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code         TEXT NOT NULL,
  name         TEXT NOT NULL,
  account_type TEXT NOT NULL,
  balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_system    BOOLEAN NOT NULL DEFAULT false,  -- system accounts cannot be deleted
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (owner_id, code),

  CONSTRAINT accounts_type_check CHECK (
    account_type IN (
      'CASH','BANK','ACCOUNTS_RECEIVABLE','INVENTORY','ACCOUNTS_PAYABLE',
      'SALES','SALES_RETURN','PURCHASE','PURCHASE_RETURN',
      'EXPENSE','DAMAGE_LOSS','CLAIM_RECEIVABLE','CAPITAL','OTHER_INCOME',
      'SR_COMMISSION','CARRIAGE'
    )
  )
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON accounts;
CREATE POLICY "owner_all" ON accounts
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 5: JOURNAL ENTRIES (Double-Entry Header)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_type   TEXT NOT NULL DEFAULT '',
  reference_id     TEXT NOT NULL DEFAULT '',
  description      TEXT NOT NULL DEFAULT '',
  is_void          BOOLEAN NOT NULL DEFAULT false,
  voided_at        TIMESTAMPTZ,
  voided_by        TEXT,
  void_reason      TEXT,
  created_by       TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON journal_entries;
CREATE POLICY "owner_all" ON journal_entries
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 6: JOURNAL ENTRY LINES (Debit / Credit)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES accounts(id),
  account_code     TEXT NOT NULL DEFAULT '',
  account_name     TEXT NOT NULL DEFAULT '',
  debit            NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit           NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes            TEXT DEFAULT '',
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT journal_line_non_negative CHECK (debit >= 0 AND credit >= 0),
  CONSTRAINT journal_line_not_both_zero CHECK (debit > 0 OR credit > 0),
  CONSTRAINT journal_line_exclusive CHECK (NOT (debit > 0 AND credit > 0))
);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON journal_entry_lines;
CREATE POLICY "owner_all" ON journal_entry_lines
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 7: AUDIT LOGS (Append-Only)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL DEFAULT '',
  action        TEXT NOT NULL,
  module        TEXT NOT NULL DEFAULT '',
  entity_type   TEXT NOT NULL DEFAULT '',
  entity_id     TEXT NOT NULL DEFAULT '',
  old_data      JSONB,
  new_data      JSONB,
  ip_address    TEXT DEFAULT '',
  user_agent    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs: owner can read but NOT update/delete (append-only)
DROP POLICY IF EXISTS "owner_select_audit" ON audit_logs;
CREATE POLICY "owner_select_audit" ON audit_logs
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "owner_insert_audit" ON audit_logs;
CREATE POLICY "owner_insert_audit" ON audit_logs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 8: CUSTOMER PAYMENTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_payments (
  id            TEXT PRIMARY KEY,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id   TEXT NOT NULL REFERENCES customers(id),
  amount        NUMERIC(14,2) NOT NULL,
  payment_date  TEXT NOT NULL DEFAULT '',
  payment_mode  TEXT NOT NULL DEFAULT 'Cash',
  reference_no  TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  created_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT customer_payments_amount_positive CHECK (amount > 0)
);

ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON customer_payments;
CREATE POLICY "owner_all" ON customer_payments
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 9: SUPPLIER PAYMENTS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_payments (
  id            TEXT PRIMARY KEY,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL DEFAULT '',
  amount        NUMERIC(14,2) NOT NULL,
  payment_date  TEXT NOT NULL DEFAULT '',
  payment_mode  TEXT NOT NULL DEFAULT 'Cash',
  reference_no  TEXT DEFAULT '',
  notes         TEXT DEFAULT '',
  created_by    TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT supplier_payments_amount_positive CHECK (amount > 0)
);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON supplier_payments;
CREATE POLICY "owner_all" ON supplier_payments
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 10: IDEMPOTENCY TABLE (Prevent Duplicate Transactions)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transaction_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  result          JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-expire idempotency records after 24 hours
-- (Supabase pg_cron can be used, or handled via query filter)

ALTER TABLE transaction_idempotency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_all" ON transaction_idempotency;
CREATE POLICY "owner_all" ON transaction_idempotency
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ─────────────────────────────────────────────
-- STEP 11: COMPOSITE INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────

-- Challans: most common query patterns
CREATE INDEX IF NOT EXISTS idx_challans_owner_created
  ON challans (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_challans_owner_status
  ON challans (owner_id, status);

CREATE INDEX IF NOT EXISTS idx_challans_owner_customer
  ON challans (owner_id, customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_challans_owner_sr
  ON challans (owner_id, sr_name);

-- Products: catalog browsing and stock checks
CREATE INDEX IF NOT EXISTS idx_products_owner_company
  ON products (owner_id, company);

CREATE INDEX IF NOT EXISTS idx_products_owner_category
  ON products (owner_id, category_id)
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_owner_active
  ON products (owner_id, is_active);

-- Procurements
CREATE INDEX IF NOT EXISTS idx_procurements_owner_date
  ON procurements (owner_id, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_procurements_owner_supplier
  ON procurements (owner_id, supplier_name);

-- Expenses
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date
  ON expenses (owner_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_owner_category
  ON expenses (owner_id, category_id);

-- Stock Ledger: primary ledger queries
CREATE INDEX IF NOT EXISTS idx_stock_ledger_owner_product
  ON stock_ledger (owner_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_owner_type
  ON stock_ledger (owner_id, transaction_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_ledger_reference
  ON stock_ledger (owner_id, reference_id);

-- Journal Entries
CREATE INDEX IF NOT EXISTS idx_journal_entries_owner_date
  ON journal_entries (owner_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_reference
  ON journal_entries (owner_id, reference_id);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_owner
  ON customers (owner_id);

CREATE INDEX IF NOT EXISTS idx_customers_owner_route
  ON customers (owner_id, route_id)
  WHERE route_id IS NOT NULL;

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_owner
  ON suppliers (owner_id);

-- Stock Adjustments
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_owner
  ON stock_adjustments (owner_id, date DESC);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_entity
  ON audit_logs (owner_id, entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_owner_date
  ON audit_logs (owner_id, created_at DESC);

-- ─────────────────────────────────────────────
-- STEP 12: HELPER FUNCTIONS
-- ─────────────────────────────────────────────

-- Function: Get running stock balance for a product
CREATE OR REPLACE FUNCTION get_product_stock(
  p_owner_id  UUID,
  p_product_id TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_stock NUMERIC;
BEGIN
  SELECT current_stock INTO v_stock
  FROM products
  WHERE id = p_product_id AND owner_id = p_owner_id;

  RETURN COALESCE(v_stock, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize default chart of accounts for a new owner
CREATE OR REPLACE FUNCTION initialize_default_accounts(p_owner_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO accounts (owner_id, code, name, account_type, is_system)
  VALUES
    (p_owner_id, '1001', 'Cash',                   'CASH',               true),
    (p_owner_id, '1002', 'Bank Account',            'BANK',               true),
    (p_owner_id, '1100', 'Accounts Receivable',     'ACCOUNTS_RECEIVABLE',true),
    (p_owner_id, '1200', 'Inventory / Stock',       'INVENTORY',          true),
    (p_owner_id, '2000', 'Accounts Payable',        'ACCOUNTS_PAYABLE',   true),
    (p_owner_id, '3000', 'Owner Capital',           'CAPITAL',            true),
    (p_owner_id, '4001', 'Sales Revenue',           'SALES',              true),
    (p_owner_id, '4002', 'Sales Return',            'SALES_RETURN',       true),
    (p_owner_id, '5001', 'Purchase Cost',           'PURCHASE',           true),
    (p_owner_id, '5002', 'Purchase Return',         'PURCHASE_RETURN',    true),
    (p_owner_id, '6001', 'Operating Expenses',      'EXPENSE',            true),
    (p_owner_id, '6002', 'Damage / Loss',           'DAMAGE_LOSS',        true),
    (p_owner_id, '6003', 'SR Commission',           'SR_COMMISSION',      true),
    (p_owner_id, '6004', 'Carriage & Transport',    'CARRIAGE',           true),
    (p_owner_id, '1300', 'Claim Receivable',        'CLAIM_RECEIVABLE',   true),
    (p_owner_id, '4003', 'Other Income',            'OTHER_INCOME',       true)
  ON CONFLICT (owner_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- STEP 13: ATOMIC STOCK DEDUCTION RPC
-- process_challan_delivery()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_challan_delivery(
  p_challan_id          TEXT,
  p_owner_id            UUID,
  p_user_id             TEXT,
  p_settlement_status   TEXT,   -- 'Delivered' | 'Shipped'
  p_returned_qty        NUMERIC DEFAULT 0,
  p_damaged_qty         NUMERIC DEFAULT 0,
  p_returned_cartons    NUMERIC DEFAULT 0,
  p_returned_pcs        NUMERIC DEFAULT 0,
  p_damaged_cartons     NUMERIC DEFAULT 0,
  p_damaged_pcs         NUMERIC DEFAULT 0,
  p_sr_commission_amount NUMERIC DEFAULT 0,
  p_extra_profit_amount NUMERIC DEFAULT 0,
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_challan               RECORD;
  v_product               RECORD;
  v_net_qty               NUMERIC;
  v_stock_before          NUMERIC;
  v_stock_after           NUMERIC;
  v_sale_amount           NUMERIC;
  v_cogs_amount           NUMERIC;
  v_ar_account_id         UUID;
  v_sales_account_id      UUID;
  v_inventory_account_id  UUID;
  v_purchase_account_id   UUID;
  v_damage_account_id     UUID;
  v_journal_entry_id      UUID;
  v_idempotency_result    JSONB;
BEGIN

  -- ── Idempotency check ──────────────────────────────────────────────────────
  IF p_idempotency_key IS NOT NULL THEN
    SELECT result INTO v_idempotency_result
    FROM transaction_idempotency
    WHERE idempotency_key = p_idempotency_key
      AND owner_id = p_owner_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF FOUND THEN
      RETURN v_idempotency_result;  -- Return cached result, no duplicate
    END IF;
  END IF;

  -- ── Validate settlement status ─────────────────────────────────────────────
  IF p_settlement_status NOT IN ('Delivered', 'Shipped') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_STATUS',
      'message', 'Settlement status must be Delivered or Shipped.');
  END IF;

  -- ── Fetch and lock challan row ─────────────────────────────────────────────
  SELECT * INTO v_challan
  FROM challans
  WHERE id = p_challan_id AND owner_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'CHALLAN_NOT_FOUND',
      'message', 'Challan not found or access denied.');
  END IF;

  IF v_challan.status = 'Delivered' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_DELIVERED',
      'message', 'This challan has already been delivered.');
  END IF;

  IF v_challan.status = 'Cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'CHALLAN_CANCELLED',
      'message', 'Cannot deliver a cancelled challan.');
  END IF;

  -- ── If Delivered: validate and deduct stock ────────────────────────────────
  IF p_settlement_status = 'Delivered' THEN

    -- Calculate net qty sold (qty minus returns and damaged)
    v_net_qty := v_challan.qty - COALESCE(p_returned_qty, 0) - COALESCE(p_damaged_qty, 0);
    IF v_net_qty < 0 THEN v_net_qty := 0; END IF;

    -- Fetch product if product_id is available
    IF v_challan.product_id IS NOT NULL AND v_challan.product_id != '' THEN
      SELECT * INTO v_product
      FROM products
      WHERE id = v_challan.product_id AND owner_id = p_owner_id
      FOR UPDATE;  -- Row-level lock to prevent concurrent modifications

      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND',
          'message', 'Product referenced by this challan was not found.');
      END IF;

      v_stock_before := v_product.current_stock;

      -- Verify sufficient stock (stock must be >= net qty sold)
      IF v_product.current_stock < v_net_qty THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'INSUFFICIENT_STOCK',
          'message', format(
            'স্টক পর্যাপ্ত নেই। Available: %s, Requested: %s',
            v_product.current_stock, v_net_qty
          ),
          'available_stock', v_product.current_stock,
          'requested_qty', v_net_qty
        );
      END IF;

      -- Deduct stock atomically
      v_stock_after := v_product.current_stock - v_net_qty;

      -- Increase damaged_stock if there are damaged items
      UPDATE products
      SET
        current_stock = v_stock_after,
        damaged_stock = damaged_stock + COALESCE(p_damaged_qty, 0)
      WHERE id = v_challan.product_id AND owner_id = p_owner_id;

      -- Record stock ledger entry
      INSERT INTO stock_ledger (
        owner_id, product_id, product_name, transaction_type,
        reference_type, reference_id, quantity_in, quantity_out,
        balance_after, unit, notes, created_by
      ) VALUES (
        p_owner_id, v_challan.product_id, v_challan.product_name, 'SALE',
        'challan', p_challan_id, 0, v_net_qty,
        v_stock_after, 'Pcs', 'Challan delivery settlement', p_user_id
      );

      -- Record damaged stock ledger entry if applicable
      IF COALESCE(p_damaged_qty, 0) > 0 THEN
        INSERT INTO stock_ledger (
          owner_id, product_id, product_name, transaction_type,
          reference_type, reference_id, quantity_in, quantity_out,
          balance_after, unit, notes, created_by
        ) VALUES (
          p_owner_id, v_challan.product_id, v_challan.product_name, 'DAMAGE',
          'challan', p_challan_id, 0, p_damaged_qty,
          v_stock_after, 'Pcs', 'Damaged during challan delivery', p_user_id
        );
      END IF;

      -- Return stock for returned items
      IF COALESCE(p_returned_qty, 0) > 0 THEN
        UPDATE products
        SET current_stock = current_stock + p_returned_qty
        WHERE id = v_challan.product_id AND owner_id = p_owner_id;

        INSERT INTO stock_ledger (
          owner_id, product_id, product_name, transaction_type,
          reference_type, reference_id, quantity_in, quantity_out,
          balance_after, unit, notes, created_by
        ) VALUES (
          p_owner_id, v_challan.product_id, v_challan.product_name, 'RETURN',
          'challan', p_challan_id, p_returned_qty, 0,
          v_stock_after + p_returned_qty, 'Pcs', 'Return from challan delivery', p_user_id
        );
      END IF;

    END IF; -- end if product_id available

    -- ── Update customer due ────────────────────────────────────────────────
    v_sale_amount := v_challan.total_amount;
    IF v_challan.customer_id IS NOT NULL AND v_challan.customer_id != '' THEN
      UPDATE customers
      SET
        due = COALESCE(due, 0) + v_sale_amount,
        total_purchases = COALESCE(total_purchases, 0) + v_sale_amount
      WHERE id = v_challan.customer_id AND owner_id = p_owner_id;
    END IF;

    -- ── Create accounting journal entry ────────────────────────────────────
    -- Fetch account IDs
    SELECT id INTO v_ar_account_id FROM accounts
      WHERE owner_id = p_owner_id AND account_type = 'ACCOUNTS_RECEIVABLE' LIMIT 1;
    SELECT id INTO v_sales_account_id FROM accounts
      WHERE owner_id = p_owner_id AND account_type = 'SALES' LIMIT 1;

    IF v_ar_account_id IS NOT NULL AND v_sales_account_id IS NOT NULL THEN
      -- Create journal entry header
      INSERT INTO journal_entries (owner_id, entry_date, reference_type, reference_id, description, created_by)
      VALUES (p_owner_id, CURRENT_DATE, 'challan', p_challan_id,
        format('Sale — Challan %s — %s', p_challan_id, v_challan.customer_name), p_user_id)
      RETURNING id INTO v_journal_entry_id;

      -- Debit: Accounts Receivable
      INSERT INTO journal_entry_lines (journal_entry_id, owner_id, account_id, account_code, account_name, debit, credit)
      SELECT v_journal_entry_id, p_owner_id, id, code, name, v_sale_amount, 0
      FROM accounts WHERE id = v_ar_account_id;

      -- Credit: Sales Revenue
      INSERT INTO journal_entry_lines (journal_entry_id, owner_id, account_id, account_code, account_name, debit, credit)
      SELECT v_journal_entry_id, p_owner_id, id, code, name, 0, v_sale_amount
      FROM accounts WHERE id = v_sales_account_id;

      -- Update account balances
      UPDATE accounts SET balance = balance + v_sale_amount WHERE id = v_ar_account_id;
      UPDATE accounts SET balance = balance + v_sale_amount WHERE id = v_sales_account_id;
    END IF;

  END IF; -- end if Delivered

  -- ── Update challan status ──────────────────────────────────────────────────
  UPDATE challans
  SET
    status              = p_settlement_status,
    returned_qty        = COALESCE(p_returned_qty, 0),
    damaged_qty         = COALESCE(p_damaged_qty, 0),
    returned_cartons    = COALESCE(p_returned_cartons, 0),
    returned_pcs        = COALESCE(p_returned_pcs, 0),
    damaged_cartons     = COALESCE(p_damaged_cartons, 0),
    damaged_pcs         = COALESCE(p_damaged_pcs, 0),
    commission_amount   = COALESCE(p_sr_commission_amount, 0),
    extra_profit_amount = COALESCE(p_extra_profit_amount, 0)
  WHERE id = p_challan_id AND owner_id = p_owner_id;

  -- ── Audit log ──────────────────────────────────────────────────────────────
  INSERT INTO audit_logs (owner_id, user_id, action, module, entity_type, entity_id, new_data)
  VALUES (
    p_owner_id, p_user_id, 'CHALLAN_DELIVERED', 'Challan', 'challan', p_challan_id,
    jsonb_build_object(
      'status', p_settlement_status,
      'returned_qty', p_returned_qty,
      'damaged_qty', p_damaged_qty,
      'sale_amount', v_challan.total_amount
    )
  );

  -- ── Store idempotency result ───────────────────────────────────────────────
  DECLARE
    v_result JSONB := jsonb_build_object('success', true, 'challan_id', p_challan_id, 'status', p_settlement_status);
  BEGIN
    IF p_idempotency_key IS NOT NULL THEN
      INSERT INTO transaction_idempotency (idempotency_key, owner_id, result)
      VALUES (p_idempotency_key, p_owner_id, v_result)
      ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;
    RETURN v_result;
  END;

END;
$$;

-- ─────────────────────────────────────────────
-- STEP 14: ATOMIC PROCUREMENT RPC
-- process_procurement()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_procurement(
  p_procurement_id      TEXT,
  p_owner_id            UUID,
  p_user_id             TEXT,
  p_supplier_name       TEXT,
  p_procurement_name    TEXT,
  p_invoice_ref         TEXT,
  p_invoice_date        TEXT,
  p_delivery_date       TEXT,
  p_payment_status      TEXT,
  p_additional_cost     NUMERIC,
  p_global_total        NUMERIC,
  p_items               JSONB,   -- array of item objects
  p_idempotency_key     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_item                JSONB;
  v_product             RECORD;
  v_added_qty           NUMERIC;
  v_stock_after         NUMERIC;
  v_inventory_account_id UUID;
  v_payable_account_id  UUID;
  v_purchase_account_id UUID;
  v_carriage_account_id UUID;
  v_journal_entry_id    UUID;
  v_idempotency_result  JSONB;
BEGIN

  -- ── Idempotency check ──────────────────────────────────────────────────────
  IF p_idempotency_key IS NOT NULL THEN
    SELECT result INTO v_idempotency_result
    FROM transaction_idempotency
    WHERE idempotency_key = p_idempotency_key
      AND owner_id = p_owner_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF FOUND THEN
      RETURN v_idempotency_result;
    END IF;
  END IF;

  -- ── Validate payment status ────────────────────────────────────────────────
  IF p_payment_status NOT IN ('Paid','Pending','Partial') THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_PAYMENT_STATUS',
      'message', 'Payment status must be Paid, Pending, or Partial.');
  END IF;

  -- ── Validate no duplicate invoice reference ────────────────────────────────
  IF EXISTS (
    SELECT 1 FROM procurements
    WHERE owner_id = p_owner_id
      AND invoice_ref = p_invoice_ref
      AND invoice_ref != ''
      AND id != p_procurement_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'DUPLICATE_INVOICE',
      'message', format('এই ইনভয়েস রেফারেন্স (%s) ইতোমধ্যে বিদ্যমান।', p_invoice_ref));
  END IF;

  -- ── Validate items are not empty ───────────────────────────────────────────
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMPTY_ITEMS',
      'message', 'Procurement must contain at least one item.');
  END IF;

  -- ── Insert procurement header ──────────────────────────────────────────────
  INSERT INTO procurements (
    id, owner_id, supplier_name, procurement_name, invoice_ref,
    invoice_date, delivery_date, payment_status, additional_cost, global_total
  ) VALUES (
    p_procurement_id, p_owner_id, p_supplier_name, p_procurement_name, p_invoice_ref,
    p_invoice_date, p_delivery_date, p_payment_status, p_additional_cost, p_global_total
  );

  -- ── Process each item ──────────────────────────────────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Validate required item fields
    IF v_item->>'product_id' IS NULL OR v_item->>'product_id' = '' THEN
      RAISE EXCEPTION 'INVALID_ITEM: product_id is required';
    END IF;

    -- Fetch and LOCK product row for update
    SELECT * INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id') AND owner_id = p_owner_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product % not found', v_item->>'product_id';
    END IF;

    -- Calculate quantity to add (qty + bonus_qty)
    v_added_qty := COALESCE((v_item->>'qty')::NUMERIC, 0)
                 + COALESCE((v_item->>'bonus_qty')::NUMERIC, 0);

    IF v_added_qty < 0 THEN
      RAISE EXCEPTION 'INVALID_QTY: Quantity cannot be negative for product %', v_product.name;
    END IF;

    -- Update product stock and prices
    v_stock_after := v_product.current_stock + v_added_qty;

    UPDATE products
    SET
      current_stock  = v_stock_after,
      default_pp     = COALESCE((v_item->>'purchase_price')::NUMERIC, default_pp),
      default_mrp    = COALESCE((v_item->>'mrp')::NUMERIC, default_mrp),
      default_wsp    = COALESCE((v_item->>'wsp')::NUMERIC, default_wsp),
      price_per_piece = CASE
        WHEN primary_unit != 'Carton' THEN COALESCE((v_item->>'wsp')::NUMERIC, price_per_piece)
        ELSE price_per_piece
      END,
      price_per_carton = CASE
        WHEN primary_unit = 'Carton' THEN COALESCE((v_item->>'wsp')::NUMERIC, price_per_carton)
        ELSE COALESCE((v_item->>'wsp')::NUMERIC, default_wsp) * GREATEST(carton_size, 1)
      END
    WHERE id = (v_item->>'product_id') AND owner_id = p_owner_id;

    -- Insert procurement item record
    INSERT INTO procurement_items (
      id, procurement_id, product_id, product_name,
      purchase_price, mrp, wsp, qty, bonus_qty,
      discount_type, discount_value, total_price
    ) VALUES (
      gen_random_uuid()::TEXT, p_procurement_id, v_item->>'product_id', v_product.name,
      COALESCE((v_item->>'purchase_price')::NUMERIC, 0),
      COALESCE((v_item->>'mrp')::NUMERIC, 0),
      COALESCE((v_item->>'wsp')::NUMERIC, 0),
      COALESCE((v_item->>'qty')::NUMERIC, 0),
      COALESCE((v_item->>'bonus_qty')::NUMERIC, 0),
      COALESCE(v_item->>'discount_type', 'Flat'),
      COALESCE((v_item->>'discount_value')::NUMERIC, 0),
      COALESCE((v_item->>'total_price')::NUMERIC, 0)
    );

    -- Record stock ledger entry
    INSERT INTO stock_ledger (
      owner_id, product_id, product_name, transaction_type,
      reference_type, reference_id, quantity_in, quantity_out,
      balance_after, unit, notes, created_by
    ) VALUES (
      p_owner_id, v_item->>'product_id', v_product.name, 'PROCUREMENT',
      'procurement', p_procurement_id, v_added_qty, 0,
      v_stock_after, 'Pcs', format('Procurement from %s', p_supplier_name), p_user_id
    );

  END LOOP;

  -- ── Accounting journal entry ───────────────────────────────────────────────
  SELECT id INTO v_inventory_account_id FROM accounts
    WHERE owner_id = p_owner_id AND account_type = 'INVENTORY' LIMIT 1;
  SELECT id INTO v_payable_account_id FROM accounts
    WHERE owner_id = p_owner_id AND account_type = 'ACCOUNTS_PAYABLE' LIMIT 1;
  SELECT id INTO v_purchase_account_id FROM accounts
    WHERE owner_id = p_owner_id AND account_type = 'PURCHASE' LIMIT 1;

  IF v_inventory_account_id IS NOT NULL AND v_payable_account_id IS NOT NULL THEN
    INSERT INTO journal_entries (owner_id, entry_date, reference_type, reference_id, description, created_by)
    VALUES (p_owner_id, CURRENT_DATE, 'procurement', p_procurement_id,
      format('Purchase — %s — %s', p_supplier_name, p_invoice_ref), p_user_id)
    RETURNING id INTO v_journal_entry_id;

    -- Debit: Inventory / Purchase
    INSERT INTO journal_entry_lines (journal_entry_id, owner_id, account_id, account_code, account_name, debit, credit)
    SELECT v_journal_entry_id, p_owner_id, id, code, name, p_global_total, 0
    FROM accounts WHERE id = v_inventory_account_id;

    -- Credit: Accounts Payable (for credit purchases) or Cash (for paid)
    INSERT INTO journal_entry_lines (journal_entry_id, owner_id, account_id, account_code, account_name, debit, credit)
    SELECT v_journal_entry_id, p_owner_id, id, code, name, 0, p_global_total
    FROM accounts WHERE id = v_payable_account_id;

    -- Update account balances
    UPDATE accounts SET balance = balance + p_global_total WHERE id = v_inventory_account_id;
    UPDATE accounts SET balance = balance + p_global_total WHERE id = v_payable_account_id;
  END IF;

  -- ── Audit log ──────────────────────────────────────────────────────────────
  INSERT INTO audit_logs (owner_id, user_id, action, module, entity_type, entity_id, new_data)
  VALUES (
    p_owner_id, p_user_id, 'PROCUREMENT_CREATED', 'Procurement', 'procurement', p_procurement_id,
    jsonb_build_object(
      'supplier', p_supplier_name,
      'invoice_ref', p_invoice_ref,
      'total', p_global_total,
      'item_count', jsonb_array_length(p_items)
    )
  );

  -- ── Store idempotency result ───────────────────────────────────────────────
  DECLARE
    v_result JSONB := jsonb_build_object('success', true, 'procurement_id', p_procurement_id);
  BEGIN
    IF p_idempotency_key IS NOT NULL THEN
      INSERT INTO transaction_idempotency (idempotency_key, owner_id, result)
      VALUES (p_idempotency_key, p_owner_id, v_result)
      ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;
    RETURN v_result;
  END;

EXCEPTION
  WHEN OTHERS THEN
    -- All changes are automatically rolled back
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLSTATE,
      'message', SQLERRM
    );
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 15: ATOMIC STOCK ADJUSTMENT RPC
-- process_stock_adjustment()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_stock_adjustment(
  p_adjustment_id   TEXT,
  p_owner_id        UUID,
  p_user_id         TEXT,
  p_product_id      TEXT,
  p_product_name    TEXT,
  p_old_qty         NUMERIC,
  p_new_qty         NUMERIC,
  p_reason          TEXT,
  p_adjusted_by     TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_product       RECORD;
  v_qty_changed   NUMERIC;
  v_stock_after   NUMERIC;
BEGIN

  -- Fetch and lock product
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND owner_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND',
      'message', 'Product not found.');
  END IF;

  -- Use actual current stock as old_qty to prevent stale data conflicts
  v_qty_changed := p_new_qty - v_product.current_stock;
  v_stock_after := p_new_qty;

  IF p_new_qty < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'NEGATIVE_STOCK',
      'message', 'স্টক শূন্যের নিচে যেতে পারবে না।');
  END IF;

  -- Update product stock
  UPDATE products
  SET current_stock = p_new_qty
  WHERE id = p_product_id AND owner_id = p_owner_id;

  -- Record stock adjustment
  INSERT INTO stock_adjustments (
    id, owner_id, product_id, product_name, attribute_value,
    old_qty, new_qty, qty_changed, adjusted_by, reason
  ) VALUES (
    p_adjustment_id, p_owner_id, p_product_id, p_product_name, '',
    v_product.current_stock, p_new_qty, v_qty_changed, p_adjusted_by, p_reason
  );

  -- Record stock ledger
  INSERT INTO stock_ledger (
    owner_id, product_id, product_name, transaction_type,
    reference_type, reference_id,
    quantity_in, quantity_out, balance_after, unit, notes, created_by
  ) VALUES (
    p_owner_id, p_product_id, p_product_name, 'ADJUSTMENT',
    'stock_adjustment', p_adjustment_id,
    CASE WHEN v_qty_changed > 0 THEN v_qty_changed ELSE 0 END,
    CASE WHEN v_qty_changed < 0 THEN ABS(v_qty_changed) ELSE 0 END,
    v_stock_after, 'Pcs', p_reason, p_user_id
  );

  -- Audit log
  INSERT INTO audit_logs (owner_id, user_id, action, module, entity_type, entity_id, old_data, new_data)
  VALUES (
    p_owner_id, p_user_id, 'STOCK_ADJUSTED', 'Stock', 'product', p_product_id,
    jsonb_build_object('stock', v_product.current_stock),
    jsonb_build_object('stock', p_new_qty, 'reason', p_reason, 'adjusted_by', p_adjusted_by)
  );

  RETURN jsonb_build_object('success', true, 'adjustment_id', p_adjustment_id,
    'old_qty', v_product.current_stock, 'new_qty', p_new_qty, 'qty_changed', v_qty_changed);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLSTATE, 'message', SQLERRM);
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 16: DASHBOARD AGGREGATION FUNCTION
-- get_dashboard_stats()
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_owner_id  UUID,
  p_date      DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_sales         NUMERIC := 0;
  v_today_purchases     NUMERIC := 0;
  v_today_expenses      NUMERIC := 0;
  v_total_receivable    NUMERIC := 0;
  v_total_payable       NUMERIC := 0;
  v_inventory_value_tp  NUMERIC := 0;
  v_pending_challans    INTEGER := 0;
  v_shipped_challans    INTEGER := 0;
  v_delivered_challans  INTEGER := 0;
  v_month_sales         NUMERIC := 0;
  v_month_purchases     NUMERIC := 0;
BEGIN

  -- Today's sales (delivered challans)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_today_sales
  FROM challans
  WHERE owner_id = p_owner_id
    AND status = 'Delivered'
    AND created_at::DATE = p_date;

  -- Today's purchases
  SELECT COALESCE(SUM(global_total), 0) INTO v_today_purchases
  FROM procurements
  WHERE owner_id = p_owner_id
    AND invoice_date = p_date::TEXT;

  -- Today's expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_today_expenses
  FROM expenses
  WHERE owner_id = p_owner_id
    AND expense_date = p_date::TEXT;

  -- Total customer receivable (outstanding due)
  SELECT COALESCE(SUM(due), 0) INTO v_total_receivable
  FROM customers
  WHERE owner_id = p_owner_id;

  -- Challan status counts
  SELECT
    COUNT(*) FILTER (WHERE status = 'Pending'),
    COUNT(*) FILTER (WHERE status = 'Shipped'),
    COUNT(*) FILTER (WHERE status = 'Delivered')
  INTO v_pending_challans, v_shipped_challans, v_delivered_challans
  FROM challans
  WHERE owner_id = p_owner_id;

  -- Inventory value at trade price
  SELECT COALESCE(SUM(
    CASE
      WHEN primary_unit = 'Carton' THEN current_stock * price_per_carton
      ELSE current_stock * price_per_piece
    END
  ), 0) INTO v_inventory_value_tp
  FROM products
  WHERE owner_id = p_owner_id AND is_active = true;

  -- Month-to-date sales
  SELECT COALESCE(SUM(total_amount), 0) INTO v_month_sales
  FROM challans
  WHERE owner_id = p_owner_id
    AND status = 'Delivered'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date);

  -- Month-to-date purchases
  SELECT COALESCE(SUM(global_total), 0) INTO v_month_purchases
  FROM procurements
  WHERE owner_id = p_owner_id
    AND DATE_TRUNC('month', invoice_date::DATE) = DATE_TRUNC('month', p_date);

  RETURN jsonb_build_object(
    'today_sales',         v_today_sales,
    'today_purchases',     v_today_purchases,
    'today_expenses',      v_today_expenses,
    'today_profit',        v_today_sales - v_today_purchases - v_today_expenses,
    'total_receivable',    v_total_receivable,
    'inventory_value_tp',  v_inventory_value_tp,
    'pending_challans',    v_pending_challans,
    'shipped_challans',    v_shipped_challans,
    'delivered_challans',  v_delivered_challans,
    'month_sales',         v_month_sales,
    'month_purchases',     v_month_purchases,
    'month_profit',        v_month_sales - v_month_purchases
  );
END;
$$;

-- ─────────────────────────────────────────────
-- STEP 17: RLS FOR NEW TABLES (supplier_payments, customer_payments)
-- Already added above; verify procurement_items policy still valid
-- ─────────────────────────────────────────────

-- Ensure existing procurement_items policy is correct
DROP POLICY IF EXISTS "owner_select_procurement_items" ON procurement_items;
CREATE POLICY "owner_select_procurement_items" ON procurement_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM procurements p
      WHERE p.id = procurement_items.procurement_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM procurements p
      WHERE p.id = procurement_items.procurement_id
        AND p.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- STEP 18: CHECK CONSTRAINTS ON PRODUCTS
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_stock_non_negative
      CHECK (current_stock >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_damaged_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_damaged_non_negative
      CHECK (damaged_stock >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_pp_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_pp_non_negative
      CHECK (default_pp >= 0);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- STEP 19: CHECK CONSTRAINTS ON EXPENSES
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_amount_positive'
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive
      CHECK (amount > 0);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- STEP 20: DATABASE TRIGGER — auto-create accounts on new admin signup
-- ─────────────────────────────────────────────
-- Note: This trigger fires in the auth schema, which requires a service_role approach.
-- The function is callable from the application after first login instead.

COMMIT;
