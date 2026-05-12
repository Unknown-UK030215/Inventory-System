-- =========================================
-- DIAGNOSTIC & FORCE FIX SCRIPT
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
