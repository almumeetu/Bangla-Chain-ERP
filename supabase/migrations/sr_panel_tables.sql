-- ============================================================
-- SR Panel Extensions: Attendance, Collections, and Targets
-- ============================================================

-- ─────────────────────────────────────────────
-- SR ATTENDANCE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sr_attendance (
  id          TEXT PRIMARY KEY,
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sr_id       TEXT NOT NULL,
  sr_name     TEXT NOT NULL,
  date        TEXT NOT NULL,
  day_start   TIMESTAMPTZ,
  day_end     TIMESTAMPTZ,
  route_name  TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- SR COLLECTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sr_collections (
  id              TEXT PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sr_id           TEXT NOT NULL,
  sr_name         TEXT NOT NULL,
  challan_id      TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'Cash',
  collected_at    TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS sr_collections ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────
-- SR TARGETS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sr_targets (
  id              TEXT PRIMARY KEY,
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sr_id           TEXT NOT NULL,
  sr_name         TEXT NOT NULL,
  month           TEXT NOT NULL, -- e.g. '2026-08'
  company_id      TEXT DEFAULT '',
  company_name    TEXT DEFAULT '',
  target_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sr_attendance  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sr_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sr_targets     ENABLE ROW LEVEL SECURITY;

-- Helper: drop policies if existing
DO $$
DECLARE
  tbl TEXT;
  tbls TEXT[] := ARRAY['sr_attendance', 'sr_collections', 'sr_targets'];
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_all" ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY "owner_all" ON %I
       FOR ALL USING (owner_id = auth.uid())
       WITH CHECK (owner_id = auth.uid())',
      tbl
    );
  END LOOP;
END $$;
