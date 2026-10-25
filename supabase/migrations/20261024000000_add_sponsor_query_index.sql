-- Step 12: Add composite partial index justified by EXPLAIN ANALYZE performance plan
CREATE INDEX IF NOT EXISTS idx_sponsors_active_placement_dates
ON sponsors (placement, start_date, end_date)
WHERE status = 'approved' AND is_active = true;