-- =========================================
-- JUST DROP ALL CHECK CONSTRAINTS - QUICK FIX!
-- =========================================

DO $$ 
DECLARE
    r RECORD;
    target_tables TEXT[] := ARRAY['assets', 'reports', 'disposed', 'categories', 'locations', 'users', 'admin_credentials'];
BEGIN
    FOR r IN 
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint 
        WHERE contype = 'c'
        AND conrelid::regclass::TEXT = ANY(target_tables)
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name::TEXT) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE '✅ Dropped constraint: % on table: %', r.conname, r.table_name;
    END LOOP;
    
    RAISE NOTICE '🎉 ALL check constraints dropped from inventory tables!';
END $$;

-- Verify
SELECT 'Constraints remaining on inventory tables:' AS status;
SELECT conname, contype, conrelid::regclass AS table_name
FROM pg_constraint 
WHERE contype = 'c'
AND conrelid::regclass::TEXT = ANY(ARRAY['assets', 'reports', 'disposed', 'categories', 'locations', 'users', 'admin_credentials']);
