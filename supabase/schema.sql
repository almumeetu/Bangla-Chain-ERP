-- ============================================================
-- Bangla-Chain ERP — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor once.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- SETTINGS (shop branding, per admin user)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_name     TEXT NOT NULL DEFAULT 'Samir Enterprise',
  shop_subbrand TEXT NOT NULL DEFAULT 'Dhaka & Chittagong Regional Hub',
  shop_logo     TEXT DEFAULT '',
  language      TEXT NOT NULL DEFAULT 'bn',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- ─────────────────────────────────────────────
-- SR USERS (Sales Representatives)
-- These users log in with username/password (not Supabase Auth)
-- They are linked to the admin who created them.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS srs (
  id                   TEXT PRIMARY KEY,
  owner_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  phone                TEXT NOT NULL DEFAULT '',
  commission_rate      NUMERIC(5,2) NOT NULL DEFAULT 5,
  assigned_company_ids TEXT[] NOT NULL DEFAULT '{}',
  login_username       TEXT,
  login_password       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- DELIVERY MEN
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_men (
  id         TEXT PRIMARY KEY,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  vehicle    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- COMPANIES (Brand / Manufacturer)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id             TEXT PRIMARY KEY,
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  contact_person TEXT DEFAULT '',
  phone          TEXT DEFAULT '',
  address        TEXT DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCT CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id          TEXT PRIMARY KEY,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- UNITS OF MEASURE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS units (
  id         TEXT PRIMARY KEY,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  multiplier NUMERIC(10,4) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- GODOWNS (Warehouses)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS godowns (
  id               TEXT PRIMARY KEY,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  location         TEXT DEFAULT '',
  is_damage_godown BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROUTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS routes (
  id              TEXT PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  area            TEXT NOT NULL DEFAULT '',
  territory       TEXT NOT NULL DEFAULT '',
  assigned_sr_id  TEXT DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCT ATTRIBUTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_attributes (
  id         TEXT PRIMARY KEY,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT '',
  value      TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  owner_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  sku                TEXT NOT NULL DEFAULT '',
  company            TEXT NOT NULL DEFAULT '',
  category_id        TEXT DEFAULT NULL,
  uom_id             TEXT DEFAULT NULL,
  default_godown_id  TEXT DEFAULT NULL,
  default_pp         NUMERIC(12,2) NOT NULL DEFAULT 0,
  default_mrp        NUMERIC(12,2) NOT NULL DEFAULT 0,
  default_wsp        NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_stock      NUMERIC(12,2) NOT NULL DEFAULT 0,
  damaged_stock      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CHALLANS (Delivery Challans)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challans (
  id                TEXT PRIMARY KEY,
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name      TEXT NOT NULL DEFAULT '',
  company           TEXT NOT NULL DEFAULT '',
  attribute         TEXT NOT NULL DEFAULT '',
  qty               NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_qty         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_qty         NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate              NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  sr_name           TEXT NOT NULL DEFAULT '',
  route_name        TEXT NOT NULL DEFAULT '',
  delivery_man_name TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'Pending',
  returned_qty      NUMERIC(12,2) NOT NULL DEFAULT 0,
  damaged_qty       NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROCUREMENT ITEMS (embedded in procurements)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurement_items (
  id              TEXT PRIMARY KEY,
  procurement_id  TEXT NOT NULL,
  product_id      TEXT NOT NULL DEFAULT '',
  product_name    TEXT NOT NULL DEFAULT '',
  purchase_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  mrp             NUMERIC(12,2) NOT NULL DEFAULT 0,
  wsp             NUMERIC(12,2) NOT NULL DEFAULT 0,
  qty             NUMERIC(12,2) NOT NULL DEFAULT 0,
  bonus_qty       NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_type   TEXT NOT NULL DEFAULT 'Flat',
  discount_value  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price     NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PROCUREMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procurements (
  id               TEXT PRIMARY KEY,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_name    TEXT NOT NULL DEFAULT '',
  procurement_name TEXT NOT NULL DEFAULT '',
  invoice_ref      TEXT NOT NULL DEFAULT '',
  invoice_date     TEXT NOT NULL DEFAULT '',
  delivery_date    TEXT NOT NULL DEFAULT '',
  payment_status   TEXT NOT NULL DEFAULT 'Pending',
  additional_cost  NUMERIC(12,2) NOT NULL DEFAULT 0,
  global_total     NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- FK from procurement_items → procurements
ALTER TABLE procurement_items
  ADD CONSTRAINT fk_procurement
  FOREIGN KEY (procurement_id) REFERENCES procurements(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- STOCK ADJUSTMENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id              TEXT PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id      TEXT NOT NULL DEFAULT '',
  product_name    TEXT NOT NULL DEFAULT '',
  attribute_value TEXT NOT NULL DEFAULT '',
  old_qty         NUMERIC(12,2) NOT NULL DEFAULT 0,
  new_qty         NUMERIC(12,2) NOT NULL DEFAULT 0,
  qty_changed     NUMERIC(12,2) NOT NULL DEFAULT 0,
  adjusted_by     TEXT NOT NULL DEFAULT '',
  reason          TEXT NOT NULL DEFAULT '',
  date            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSE CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id          TEXT PRIMARY KEY,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            TEXT PRIMARY KEY,
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id   TEXT NOT NULL DEFAULT '',
  category_name TEXT NOT NULL DEFAULT '',
  amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  expense_date  TEXT NOT NULL DEFAULT '',
  notes         TEXT DEFAULT '',
  paid_to       TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT DEFAULT '',
  address    TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each admin can only see their own data.
-- ============================================================

ALTER TABLE settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_men       ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units              ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns            ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE challans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;

-- Helper: drop existing policies before recreating (idempotent re-run)
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'settings','srs','delivery_men','companies','product_categories',
    'units','godowns','routes','product_attributes','products',
    'challans','procurements','stock_adjustments',
    'expense_categories','expenses','customers'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_all" ON %I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "owner_select_procurement_items" ON %I', tbl);
  END LOOP;
END $$;

-- Macro: owner-only policy for owner_id tables
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY[
    'settings','srs','delivery_men','companies','product_categories',
    'units','godowns','routes','product_attributes','products',
    'challans','procurements','stock_adjustments',
    'expense_categories','expenses','customers'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format(
      'CREATE POLICY "owner_all" ON %I
       FOR ALL USING (owner_id = auth.uid())
       WITH CHECK (owner_id = auth.uid())',
      tbl
    );
  END LOOP;
END $$;

-- procurement_items: access via parent procurement's owner
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

-- ============================================================
-- AUTO-UPDATE updated_at on settings
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_settings_updated_at ON settings;
CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
