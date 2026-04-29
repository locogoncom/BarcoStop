-- Backfill trip_meta from legacy BSMETA embedded in trips.description
-- Safety rules:
-- 1) Never modifies existing columns except trips.trip_meta
-- 2) Only writes rows where trip_meta is NULL/empty
-- 3) Only writes when legacy suffix is valid JSON

UPDATE trips
SET trip_meta = TRIM(SUBSTRING_INDEX(description, '[BSMETA]', -1))
WHERE description LIKE '%[BSMETA]%'
  AND (trip_meta IS NULL OR TRIM(trip_meta) = '')
  AND JSON_VALID(TRIM(SUBSTRING_INDEX(description, '[BSMETA]', -1)));
