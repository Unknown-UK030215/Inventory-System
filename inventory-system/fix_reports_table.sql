-- Fix the reports table to ensure all required columns exist
-- Run this in your Supabase SQL Editor

-- Add assets_name column if it doesn't exist
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS assets_name TEXT;

-- Add asset_name column if it doesn't exist
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS asset_name TEXT;

-- If assets_name is required and has nulls, update them from name column
UPDATE reports 
SET assets_name = name 
WHERE assets_name IS NULL AND name IS NOT NULL;

-- Update asset_name from name column if needed
UPDATE reports 
SET asset_name = name 
WHERE asset_name IS NULL AND name IS NOT NULL;

-- Optional: Set default values to prevent future nulls
ALTER TABLE reports 
ALTER COLUMN assets_name SET DEFAULT 'Unknown Asset';

ALTER TABLE reports 
ALTER COLUMN asset_name SET DEFAULT 'Unknown Asset';
