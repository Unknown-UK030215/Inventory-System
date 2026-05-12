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
