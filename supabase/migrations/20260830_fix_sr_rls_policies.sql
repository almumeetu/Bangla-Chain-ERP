-- ============================================================
-- Bangla-Chain ERP — Fix SR Row Level Security (RLS) Policies
-- ============================================================
-- Automatically detects all tables with an owner_id column
-- and applies the unified Admin (auth.uid) + SR (owner_id) RLS policy.
-- ============================================================

BEGIN;

DO $$
DECLARE
  tbl RECORD;
BEGIN
  -- 1. Automatically loop through every table that has an owner_id column
  FOR tbl IN
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'owner_id'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl.table_name);

    -- Drop legacy restrictive policies
    EXECUTE format('DROP POLICY IF EXISTS "owner_all" ON %I;', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "owner_authenticated_all" ON %I;', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "sr_anon_all" ON %I;', tbl.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "allow_all_owner_or_sr" ON %I;', tbl.table_name);

    -- Create unified policy allowing Admin (auth.uid) + SR (owner_id)
    EXECUTE format(
      'CREATE POLICY "allow_all_owner_or_sr" ON %I
       FOR ALL
       USING (
         (auth.uid() IS NOT NULL AND owner_id = auth.uid())
         OR
         (owner_id IS NOT NULL)
       )
       WITH CHECK (
         (auth.uid() IS NOT NULL AND owner_id = auth.uid())
         OR
         (owner_id IS NOT NULL)
       );',
      tbl.table_name
    );
  END LOOP;

  -- 2. Handle child tables without direct owner_id (e.g. procurement_items, journal_entry_lines)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'procurement_items') THEN
    ALTER TABLE procurement_items ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "owner_select_procurement_items" ON procurement_items;
    DROP POLICY IF EXISTS "allow_all_procurement_items" ON procurement_items;
    CREATE POLICY "allow_all_procurement_items" ON procurement_items
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_entry_lines') THEN
    ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "owner_all" ON journal_entry_lines;
    DROP POLICY IF EXISTS "allow_all_journal_entry_lines" ON journal_entry_lines;
    CREATE POLICY "allow_all_journal_entry_lines" ON journal_entry_lines
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;
