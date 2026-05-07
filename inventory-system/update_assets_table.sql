-- ========================================= 
-- FINAL CLEAN DATABASE (SUPABASE SAFE) 
-- ========================================= 


-- 0. EXTENSIONS & SEQUENCES 
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
ADD COLUMN IF NOT EXISTS remarks TEXT;


-- ========================================= 
-- 4. REPORTS 
-- ========================================= 
CREATE TABLE IF NOT EXISTS reports ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  name TEXT NOT NULL, 
  serial TEXT NOT NULL, 
  type TEXT NOT NULL, 
  description TEXT, 
  reported_by TEXT, 
  status TEXT DEFAULT 'Pending', 
  created_at TIMESTAMPTZ DEFAULT now() 
); 



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

-- Add columns if users table already exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ;


-- ========================================= 
-- 6. ADMIN CREDENTIALS 
-- ========================================= 
CREATE TABLE IF NOT EXISTS admin_credentials ( 
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  username TEXT UNIQUE NOT NULL, 
  password TEXT DEFAULT nextval('admin_password_seq')::TEXT, 
  name TEXT NOT NULL, 
  email TEXT UNIQUE, 
  is_online BOOLEAN DEFAULT false, 
  is_active BOOLEAN DEFAULT true, 
  last_active TIMESTAMPTZ, 
  created_at TIMESTAMPTZ DEFAULT now() 
); 

-- Add columns if admin_credentials table already exists
ALTER TABLE admin_credentials 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ; 

-- Set all existing users/admins to offline only if is_online is NULL (to avoid overwriting currently logged-in users)
UPDATE users SET is_online = false WHERE is_online IS NULL;
UPDATE admin_credentials SET is_online = false WHERE is_online IS NULL;



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
-- SAFETY FIXES (ENSURE DEFAULTS EXIST) 
-- ========================================= 
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT gen_random_uuid(); 


ALTER TABLE admin_credentials 
ALTER COLUMN id SET DEFAULT gen_random_uuid(); 



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


-- DROP OLD POLICIES 
DROP POLICY IF EXISTS "Allow all on categories" ON categories; 
DROP POLICY IF EXISTS "Allow all on locations" ON locations; 
DROP POLICY IF EXISTS "Allow all on assets" ON assets; 
DROP POLICY IF EXISTS "Allow all on reports" ON reports; 
DROP POLICY IF EXISTS "Allow all on users" ON users; 
DROP POLICY IF EXISTS "Allow all on admin_credentials" ON admin_credentials; 
DROP POLICY IF EXISTS "Allow all on disposed" ON disposed; 


-- CREATE OPEN POLICIES (DEV MODE) 
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true); 
CREATE POLICY "Allow all on locations" ON locations FOR ALL USING (true); 
CREATE POLICY "Allow all on assets" ON assets FOR ALL USING (true); 
CREATE POLICY "Allow all on reports" ON reports FOR ALL USING (true); 
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true); 
CREATE POLICY "Allow all on admin_credentials" ON admin_credentials FOR ALL USING (true); 
CREATE POLICY "Allow all on disposed" ON disposed FOR ALL USING (true); 




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
