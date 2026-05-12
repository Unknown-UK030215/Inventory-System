-- Drop ALL check constraints on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint 
        WHERE contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE ' || r.table_name || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped constraint % on table %', r.conname, r.table_name;
    END LOOP;
END $$;

-- Verify all check constraints are gone
SELECT 'All check constraints dropped!' AS status;
SELECT conname, contype, conrelid::regclass AS table_name
FROM pg_constraint 
WHERE contype = 'c';
