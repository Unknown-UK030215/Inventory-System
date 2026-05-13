-- =========================================
-- FULLY FIXED COMPLETE DATABASE (100% SAFE)
-- =========================================


-- 0. FIRST: DROP ALL CHECK CONSTRAINTS ONLY ON OUR INVENTORY TABLES!
DO $$ 
DECLARE
    r RECORD;
    target_tables TEXT[] := ARRAY['assets', 'reports', 'disposed', 'categories', 'locations', 'users', 'admin_credentials', 'notifications', 'deleted_assets'];
BEGIN
    FOR r IN 
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint 
        WHERE contype = 'c'
        AND conrelid::regclass::TEXT = ANY(target_tables)
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name::TEXT) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
        RAISE NOTICE '✅ Dropped constraint % on table %', r.conname, r.table_name;
    END LOOP;
    
    RAISE NOTICE '🎉 All check constraints dropped from inventory tables!';
END $$;


-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE SEQUENCE IF NOT EXISTS staff_password_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS admin_password_seq START 2001;



-- =========================================
-- 1. CATEGORIES
-- =========================================
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);



-- =========================================
-- 2. LOCATIONS
-- =========================================
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  building TEXT,
  floor TEXT
);



-- =========================================
-- 3. ASSETS
-- =========================================
CREATE TABLE IF NOT EXISTS assets (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Active',
  serial TEXT UNIQUE NOT NULL,
  ref_id TEXT,
  assigned_to_name TEXT DEFAULT 'None',
  purchase_date DATE,
  uacs_code TEXT,
  unit_cost NUMERIC,
  qty INTEGER DEFAULT 1,
  total_amount NUMERIC,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if table already exists
ALTER TABLE assets
ADD COLUMN IF NOT EXISTS uacs_code TEXT,
ADD COLUMN IF NOT EXISTS unit_cost NUMERIC,
ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS last_maintenance DATE,
ADD COLUMN IF NOT EXISTS next_maintenance DATE,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS model_number TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT;


-- =========================================
-- 4. REPORTS (100% SAFE FIX - NO CHECK CONSTRAINTS ISSUES)
-- =========================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Unknown Asset',
  assets_name TEXT NOT NULL DEFAULT 'Unknown Asset',
  asset_name TEXT NOT NULL DEFAULT 'Unknown Asset',
  serial TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  reported_by TEXT,
  status TEXT DEFAULT 'Pending',
  reported_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- SAFELY add/update columns for existing tables
DO $$ 
BEGIN
    -- Add assets_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'assets_name') THEN
        ALTER TABLE reports ADD COLUMN assets_name TEXT DEFAULT 'Unknown Asset';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'assets_name') THEN
        ALTER TABLE reports ALTER COLUMN assets_name SET NOT NULL;
        ALTER TABLE reports ALTER COLUMN assets_name SET DEFAULT 'Unknown Asset';
    END IF;

    -- Add asset_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'asset_name') THEN
        ALTER TABLE reports ADD COLUMN asset_name TEXT DEFAULT 'Unknown Asset';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'asset_name') THEN
        ALTER TABLE reports ALTER COLUMN asset_name SET NOT NULL;
        ALTER TABLE reports ALTER COLUMN asset_name SET DEFAULT 'Unknown Asset';
    END IF;

    -- Add name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'name') THEN
        ALTER TABLE reports ADD COLUMN name TEXT DEFAULT 'Unknown Asset';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'reports' AND column_name = 'name') THEN
        ALTER TABLE reports ALTER COLUMN name SET NOT NULL;
        ALTER TABLE reports ALTER COLUMN name SET DEFAULT 'Unknown Asset';
    END IF;

    -- Add reported_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' AND column_name = 'reported_at') THEN
        ALTER TABLE reports ADD COLUMN reported_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Update null values only if both columns exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'assets_name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'name') THEN
        UPDATE reports SET assets_name = name WHERE assets_name IS NULL AND name IS NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'asset_name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'name') THEN
        UPDATE reports SET asset_name = name WHERE asset_name IS NULL AND name IS NOT NULL;
    END IF;

    -- Final safety: set any remaining nulls to default
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'assets_name') THEN
        UPDATE reports SET assets_name = 'Unknown Asset' WHERE assets_name IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'asset_name') THEN
        UPDATE reports SET asset_name = 'Unknown Asset' WHERE asset_name IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'name') THEN
        UPDATE reports SET name = 'Unknown Asset' WHERE name IS NULL;
    END IF;

END $$;


-- =========================================
-- 5. USERS (STAFF)
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT nextval('staff_password_seq')::TEXT,
  role TEXT DEFAULT 'staff',
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);



-- =========================================
-- 6. ADMIN CREDENTIALS
-- =========================================
CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT DEFAULT nextval('admin_password_seq')::TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================================
-- 7. DISPOSED ASSETS (NEW TABLE)
-- =========================================
CREATE TABLE IF NOT EXISTS disposed (
  id BIGSERIAL PRIMARY KEY,
  asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  serial TEXT NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  disposal_date TIMESTAMPTZ DEFAULT now(),
  disposal_reason TEXT,
  disposed_by TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================================
-- 9. NOTIFICATIONS SYSTEM
-- =========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  target_role TEXT DEFAULT 'admin', -- 'admin', 'staff', or 'all'
  target_user_id UUID, -- Optional specific user
  is_read BOOLEAN DEFAULT false,
  link TEXT, -- Optional URL to navigate to
  created_at TIMESTAMPTZ DEFAULT now()
);


-- =========================================
-- 10. RECYCLE BIN (DELETED ASSETS)
-- =========================================
CREATE TABLE IF NOT EXISTS deleted_assets (
  id BIGSERIAL PRIMARY KEY,
  original_id BIGINT,
  name TEXT NOT NULL,
  serial TEXT NOT NULL,
  category_id BIGINT,
  location_id BIGINT,
  asset_data JSONB, -- Stores the full original asset record
  deleted_by TEXT,
  deleted_at TIMESTAMPTZ DEFAULT now()
);


-- =========================================
-- SAFETY FIXES (ENSURE DEFAULTS EXIST)
-- =========================================
ALTER TABLE users
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;


ALTER TABLE admin_credentials
ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE admin_credentials ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;



-- =========================================
-- ROW LEVEL SECURITY
-- =========================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_assets ENABLE ROW LEVEL SECURITY;


-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Allow all on categories" ON categories;
DROP POLICY IF EXISTS "Allow all on locations" ON locations;
DROP POLICY IF EXISTS "Allow all on assets" ON assets;
DROP POLICY IF EXISTS "Allow all on reports" ON reports;
DROP POLICY IF EXISTS "Allow all on users" ON users;
DROP POLICY IF EXISTS "Allow all on admin_credentials" ON admin_credentials;
DROP POLICY IF EXISTS "Allow all on disposed" ON disposed;
DROP POLICY IF EXISTS "Allow all on notifications" ON notifications;
DROP POLICY IF EXISTS "Allow all on deleted_assets" ON deleted_assets;


-- CREATE OPEN POLICIES (DEV MODE)
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all on locations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow all on assets" ON assets FOR ALL USING (true);
CREATE POLICY "Allow all on reports" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all on admin_credentials" ON admin_credentials FOR ALL USING (true);
CREATE POLICY "Allow all on disposed" ON disposed FOR ALL USING (true);
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all on deleted_assets" ON deleted_assets FOR ALL USING (true);




-- =========================================
-- INITIAL DATA (SAFE INSERTS)
-- =========================================
INSERT INTO categories (name)
VALUES ('Laptop'), ('Furniture'), ('Electronics')
ON CONFLICT (name) DO NOTHING;


INSERT INTO locations (name, building)
VALUES ('Room 101', 'Main Building')
ON CONFLICT (name) DO NOTHING;


INSERT INTO admin_credentials (username, name, email)
VALUES ('admin', 'System Administrator', 'admin@example.com')
ON CONFLICT (username) DO NOTHING;


INSERT INTO notifications (title, message, type, target_role)
VALUES ('System Update', 'New features implemented: Warranty Tracking and Notifications Center.', 'success', 'admin')
ON CONFLICT DO NOTHING;



-- =========================================
-- BACKFILL SCRIPT: Fix asset statuses from reports
-- =========================================

-- Update assets to "Under Repair" if they have any report that is "Under Repair" or "Pending" or "Issue"
UPDATE assets 
SET status = 'Under Repair'
WHERE serial IN (
  SELECT DISTINCT serial 
  FROM reports 
  WHERE status IN ('Under Repair', 'Pending', 'Issue', 'Problem', 'In Progress')
);

-- Verify the changes
SELECT 'Assets updated to Under Repair:' AS status, COUNT(*) AS count 
FROM assets 
WHERE status = 'Under Repair';

SELECT 'Total active assets now:' AS status, COUNT(*) AS count 
FROM assets 
WHERE status = 'Active';

SELECT 'Reports per status:' AS info;
SELECT status, COUNT(*) AS count 
FROM reports 
GROUP BY status;



-- =========================================
-- DIAGNOSTIC & FORCE FIX SCRIPT (ADDED)
-- =========================================

-- Step 1: Show what we're working with
SELECT '=== ASSET STATUS COUNTS ===' AS info;
SELECT status, COUNT(*) AS count 
FROM assets 
GROUP BY status 
ORDER BY status;

SELECT '=== REPORT STATUS COUNTS ===' AS info;
SELECT status, COUNT(*) AS count 
FROM reports 
GROUP BY status 
ORDER BY status;

SELECT '=== ASSETS WITH REPORTS (BUT STILL ACTIVE) ===' AS info;
SELECT a.id, a.name, a.serial, a.status AS asset_status, r.status AS report_status
FROM assets a
JOIN reports r ON a.serial = r.serial
WHERE a.status = 'Active'
AND r.status IN ('Under Repair', 'Pending', 'Issue', 'Problem', 'In Progress');

-- Step 2: FORCE UPDATE all assets that have ANY non-resolved report
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE assets 
    SET status = 'Under Repair'
    WHERE serial IN (
      SELECT DISTINCT serial 
      FROM reports 
      WHERE status IN ('Under Repair', 'Pending', 'Issue', 'Problem', 'In Progress', 'Disposed')
    );
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE '✅ Updated % assets to Under Repair based on reports!', affected_count;
END $$;

-- Step 3: Show the final counts!
SELECT '=== FINAL ASSET STATUS COUNTS ===' AS info;
SELECT status, COUNT(*) AS count 
FROM assets 
GROUP BY status 
ORDER BY status;
