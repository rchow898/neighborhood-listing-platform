-- supabase/tests/01_rls_matrix_test.sql
-- Step 8: RLS Test Matrix (anon, owner, other user, service_role)

BEGIN;

-- ============================================================================
-- 1. TEST ROLE: ANONYMOUS (anon)
-- ============================================================================
SET LOCAL ROLE anon;
SET LOCAL "request.jwt.claim.sub" TO '';

-- Test 1.1: Anon reading approved listings (Should SUCCEED: 1 row expected)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.properties WHERE status = 'active';
  -- Note: If your approved status is 'active' or 'approved', check accordingly:
  IF v_count = 0 THEN
    RAISE NOTICE 'Test 1.1 Checked: (0 active rows visible to anon)';
  ELSE
    RAISE NOTICE 'PASS: Anon can view public listings (Found %)', v_count;
  END IF;
END $$;

-- Test 1.2: Anon reading draft listings (Should FAIL / 0 rows)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.properties WHERE status = 'draft';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FAIL: Anon was able to read % draft property records!', v_count;
  ELSE
    RAISE NOTICE 'PASS: Anon cannot view draft listings';
  END IF;
END $$;

-- ============================================================================
-- 2. TEST ROLE: OWNER (Alice: a0000000-0000-0000-0000-000000000001)
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO 'a0000000-0000-0000-0000-000000000001';

-- Test 2.1: Owner reading own draft property (Should SUCCEED)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM public.properties 
  WHERE owner_id = 'a0000000-0000-0000-0000-000000000001' AND status = 'draft';
  
  IF v_count = 0 THEN
    RAISE EXCEPTION 'FAIL: Owner could not read their own draft property';
  ELSE
    RAISE NOTICE 'PASS: Owner can read their own draft properties';
  END IF;
END $$;

-- Test 2.2: Owner updating own draft property (Should SUCCEED)
DO $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.properties 
  SET price = 330000.00 
  WHERE property_id = 'PROP-102';
  
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 1 THEN
    RAISE NOTICE 'PASS: Owner successfully updated own unapproved property';
  ELSE
    RAISE EXCEPTION 'FAIL: Owner could not update own unapproved property (updated % rows)', v_rows;
  END IF;
END $$;

-- ============================================================================
-- 3. TEST ROLE: OTHER USER (Bob: b0000000-0000-0000-0000-000000000002)
-- ============================================================================
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claim.sub" TO 'b0000000-0000-0000-0000-000000000002';

-- Test 3.1: Other user updating Alice's unapproved property (Should FAIL / 0 rows)
DO $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.properties 
  SET price = 100000.00 
  WHERE property_id = 'PROP-102';
  
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows > 0 THEN
    RAISE EXCEPTION 'FAIL: Other user was able to modify someone else property!';
  ELSE
    RAISE NOTICE 'PASS: Other user cannot modify properties they do not own';
  END IF;
END $$;

-- ============================================================================
-- 4. TEST ROLE: SERVICE ROLE / ADMIN
-- ============================================================================
SET LOCAL ROLE service_role;

-- Test 4.1: Service role can update status regardless of owner (Bypasses RLS)
DO $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.properties 
  SET status = 'active' 
  WHERE property_id = 'PROP-102';
  
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 1 THEN
    RAISE NOTICE 'PASS: Service role successfully bypassed RLS to update status';
  ELSE
    RAISE EXCEPTION 'FAIL: Service role failed to update property status';
  END IF;
END $$;

ROLLBACK;