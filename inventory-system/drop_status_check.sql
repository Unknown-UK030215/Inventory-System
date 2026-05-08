-- Drop the problematic reports_status_check constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;

-- Verify the constraint is gone
SELECT 'Constraint dropped successfully!' AS status;
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'reports'::regclass AND conname = 'reports_status_check';
