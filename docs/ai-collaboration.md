# AI Collaboration Checkpoint: Defensive Database Architecture & RLS Review

## 1. Prompt Pattern Used
> "Review this PostgreSQL schema and RLS plan as a defensive database engineer. Identify privilege escalation, ownership, validation, and cascade risks. Give executable tests, but use placeholders for all credentials."

---

## 2. Model Responses & Critique Comparison

### ChatGPT Output Summary
- **Privilege Escalation Risks Identified**: Warned that API routes might allow clients to send a malicious `owner_id` or set `status = 'approved'` unless explicitly sanitized.
- **Ownership Analysis**: Recommended validating that authenticated users can only insert listings where `owner_id = auth.uid()`.
- **Validation Recommendations**: Suggested keeping business validation in middleware/API.

### Gemini Output Summary
- **Database-Level Defense**: Emphasized that relying strictly on application-tier validation is insufficient; PostgreSQL should enforce database-level `CHECK` constraints (e.g., `CHECK (price > 0)` and `CHECK (bedrooms >= 0)`).
- **RLS Policy Tightening**: Advised creating an explicit `FOR SELECT` policy scoped to `status = 'active'` for public anon roles, while scoping authenticated mutations strictly to user-owned rows.
- **Index Optimization**: Recommended indexing `status` and `created_at` to avoid full table scans during filtered reads.

---

## 3. Accepted vs. Rejected Advice

### Accepted Recommendations
1. **Zod Input Boundary Layer**: Validating payloads with strict positive numbers and regex-checked ZIP codes before touching the database (`src/lib/validations/listing.ts`).
2. **Defensive Status Binding**: Overriding any user-supplied `status` field in `POST /api/listings` to force `'draft'` at ingestion time.
3. **Automated Negative Test Cases**: Implementing tests verifying rejection on missing `Authorization` headers (401) and malformed payloads (400) via Vitest (`tests/api/listings.test.ts`).
4. **Build-Time Environment Safety**: Providing safe fallback strings in `src/lib/supabaseClient.ts` to prevent prerender failures during Vercel CI compilation.

### Rejected Recommendations
1. **Service Role Key Usage in Client**: Rejected an AI recommendation to use the Supabase Service Role key in the Next.js API route without user session validation, as this completely bypasses Row-Level Security.
2. **Procedural Stored Triggers for Validation**: Rejected implementing complex PL/pgSQL triggers for basic field validations, preferring declarative constraints and Zod schemas to keep migrations maintainable.

---

## 4. Verification Checklist & Test Evidence

- **RLS Enabled & Verified**:
  - `properties` table has RLS enabled.
  - Public anonymous queries retrieve only rows where `status = 'active'`.
  - Non-active records (`status = 'draft'`) are denied to anonymous queries.
- **Secret Hygiene**:
  - `git ls-files | grep "\.env"` returns only `.env.example`.
  - No secret service keys are tracked in Git history.
- **Automated Test Results**:
  - `npm test` ran 7 tests across 2 test suites with 100% pass rate.
- **Production Build**:
  - `npm run build` compiled cleanly with Next.js Turbopack.
- **Dependency Audit**:
  - `npm audit --omit=dev` reports 0 vulnerabilities.

GEMINI

POSTGRESQL SCHEMA & RLS SECURITY AUDIT REPORT

================================================================================
1. PRIVILEGE ESCALATION RISKS
================================================================================
* Client Context Desynchronization in Route Handler:
  - In route.ts, the handler verifies the bearer token with supabaseClient.auth.getUser(token), but then executes database operations using the generic supabaseClient instance.
  - If supabaseClient uses the service_role key, Row Level Security (RLS) is entirely bypassed for all operations.
  - If supabaseClient uses the anon key, subsequent calls (such as .insert()) execute under the unauthenticated 'anon' role, causing auth.uid() within PostgreSQL RLS policies to evaluate to NULL.
* Mutable Role Columns:
  - public.profiles includes a 'role' column ('user', 'admin'). If standard UPDATE policies permit users to update their own profile row (e.g., id = auth.uid()), an attacker can promote their own account to 'admin'.
  - Remediation: Revoke column-level update permissions on the role column (REVOKE UPDATE (role) ON public.profiles FROM authenticated) or manage permissions via a dedicated RBAC table/trigger.
* Client-Side Status Overrides:
  - While route.ts sets status to 'draft', direct calls to the PostgREST endpoint can supply status = 'active' unless the RLS policy explicitly limits insertions to 'draft' via WITH CHECK.

================================================================================
2. OWNERSHIP & AUTHORIZATION RISKS
================================================================================
* Missing WITH CHECK Constraints on Ownership Updates:
  - Defining an UPDATE policy using only a USING clause allows the record owner to modify the owner_id column during an update, reassigning the property to another user. An explicit WITH CHECK (owner_id = auth.uid()) is required.
* Cross-Tenant Inquiries Access:
  - The inquiries table joins property_id and profile_id. Policies must allow access both to the inquirer (profile_id = auth.uid()) and to the listing owner (matching properties.owner_id = auth.uid()).

================================================================================
3. SCHEMA VALIDATION & INTEGRITY DEFICITS
================================================================================
* Missing Database Constraints:
  - Application-level Zod schema validation in route.ts does not protect against direct API calls via PostgREST.
  - The schema needs database-level CHECK constraints for values such as positive pricing (price >= 0) and enumerated status values ('draft', 'active', 'archived').
* Non-Default Primary Keys:
  - The schema relies on explicitly passed UUIDs in seed scripts. Tables should specify DEFAULT gen_random_uuid() to prevent ID collisions or client-side primary key manipulation.

================================================================================
4. CASCADE & REFERENTIAL INTEGRITY RISKS
================================================================================
* Auth Deletion Cascades:
  - If public.properties.owner_id is configured with ON DELETE CASCADE to auth.users, deleting an account permanently removes real estate records and audit logs. ON DELETE RESTRICT or a soft-delete mechanism is recommended.
* Many-to-Many Cascade Orphans:
  - The property_sponsors junction table must configure ON DELETE CASCADE for both property_id and sponsor_id to prevent orphaned rows when listings or sponsors are removed.

================================================================================
5. RECOMMENDED DDL & RLS POLICIES
================================================================================
-- Domain validations
ALTER TABLE public.properties
  ADD CONSTRAINT chk_properties_price_positive CHECK (price >= 0),
  ADD CONSTRAINT chk_properties_status CHECK (status IN ('draft', 'active', 'archived'));

-- Prevent column-level privilege escalation
REVOKE UPDATE (role) ON public.profiles FROM authenticated;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all public profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can only update their own display_name"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Properties Policies
CREATE POLICY "Public can view active properties"
  ON public.properties FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

CREATE POLICY "Owners can view all their own properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create draft properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() 
    AND status = 'draft'
  );

CREATE POLICY "Owners can update their own properties but cannot reassign ownership"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Inquiries Policies
CREATE POLICY "Inquirers and Property Owners can view inquiries"
  ON public.inquiries FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.properties p 
      WHERE p.id = inquiries.property_id 
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inquiries for themselves"
  ON public.inquiries FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

================================================================================
6. EXECUTABLE SECURITY VERIFICATION TESTS
================================================================================
BEGIN;

-- Helper function to simulate authenticated Supabase session
CREATE OR REPLACE FUNCTION set_mock_session(user_id uuid, role text DEFAULT 'authenticated')
RETURNS void AS $$
BEGIN
  PERFORM set_config('role', role, true);
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
  PERFORM set_config('request.jwt.claim.role', role, true);
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  alice_id uuid := 'a0000000-0000-0000-0000-000000000001';
  bob_id   uuid := 'b0000000-0000-0000-0000-000000000002';
  test_prop_id uuid;
BEGIN
  -- TEST 1: Privilege Escalation - User attempts to grant self admin role
  PERFORM set_mock_session(alice_id);
  BEGIN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = alice_id;
    RAISE EXCEPTION 'TEST 1 FAILED: User was able to elevate role to admin.';
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'TEST 1 PASSED: Role column updates rejected by permission grant.';
  END;

  -- TEST 2: Ownership Spoofing - Alice attempts to create listing for Bob
  PERFORM set_mock_session(alice_id);
  BEGIN
    INSERT INTO public.properties (
      id, owner_id, property_id, address, city, state, zip_code, price, status
    ) VALUES (
      gen_random_uuid(),
      bob_id,
      'PROP-SPOOF',
      '999 Fake Rd',
      'Austin',
      'TX',
      '78701',
      500000.00,
      'draft'
    );
    RAISE EXCEPTION 'TEST 2 FAILED: User was able to insert property with an arbitrary owner_id.';
  EXCEPTION
    WHEN row_security_policy_check_violation THEN
      RAISE NOTICE 'TEST 2 PASSED: RLS blocked unauthorized owner_id insertion.';
  END;

  -- TEST 3: Privilege Escalation - User attempts to bypass 'draft' on INSERT
  PERFORM set_mock_session(alice_id);
  BEGIN
    INSERT INTO public.properties (
      id, owner_id, property_id, address, city, state, zip_code, price, status
    ) VALUES (
      gen_random_uuid(),
      alice_id,
      'PROP-DIRECT-ACTIVE',
      '100 Main St',
      'Austin',
      'TX',
      '78701',
      250000.00,
      'active'
    );
    RAISE EXCEPTION 'TEST 3 FAILED: User inserted listing directly with status=active.';
  EXCEPTION
    WHEN row_security_policy_check_violation THEN
      RAISE NOTICE 'TEST 3 PASSED: RLS enforced status=draft on insertion.';
  END;

  -- TEST 4: Integrity Constraint - Negative price insertion
  PERFORM set_mock_session(alice_id);
  BEGIN
    INSERT INTO public.properties (
      id, owner_id, property_id, address, city, state, zip_code, price, status
    ) VALUES (
      gen_random_uuid(),
      alice_id,
      'PROP-NEG',
      '200 Main St',
      'Austin',
      'TX',
      '78701',
      -100.00,
      'draft'
    );
    RAISE EXCEPTION 'TEST 4 FAILED: Negative price was accepted.';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE 'TEST 4 PASSED: Check constraint blocked negative price.';
  END;

  -- TEST 5: Ownership Reassignment - Alice tries to reassign property to Bob
  PERFORM set_mock_session(alice_id);
  
  INSERT INTO public.properties (
    id, owner_id, property_id, address, city, state, zip_code, price, status
  ) VALUES (
    gen_random_uuid(),
    alice_id,
    'PROP-VALID',
    '300 Main St',
    'Austin',
    'TX',
    '78701',
    100000.00,
    'draft'
  ) RETURNING id INTO test_prop_id;

  BEGIN
    UPDATE public.properties 
    SET owner_id = bob_id 
    WHERE id = test_prop_id;
    RAISE EXCEPTION 'TEST 5 FAILED: Property ownership was reallocated.';
  EXCEPTION
    WHEN row_security_policy_check_violation THEN
      RAISE NOTICE 'TEST 5 PASSED: RLS WITH CHECK blocked owner_id tampering.';
  END;

END $$;

ROLLBACK;


ChatGPT


POSTGRESQL / SUPABASE SECURITY REVIEW
Review Type: Defensive Database Engineering
Scope: route.ts and seed.sql
Status: Preliminary Review — Full Schema and RLS Definitions Not Provided

\==================================================

1. EXECUTIVE SUMMARY
   \==================================================

Primary security concerns:

1. PRIVILEGE ESCALATION:
   The seed script creates a profile with role = 'admin'. Verify that users cannot modify their own role and that authorization policies do not trust user-editable metadata.

2. RLS BYPASS:
   The API validates a user token using supabaseClient.auth.getUser(token), then inserts through supabaseClient. If the database client uses a service-role or secret key, RLS may be bypassed. Verify the client initialization and JWT propagation.

3. OWNERSHIP ENFORCEMENT:
   The POST endpoint sets owner_id to the authenticated user's ID and status to 'draft'. These controls apply to this code path only. Database policies and constraints must prevent unauthorized ownership changes and publication through other write paths.

4. VALIDATION:
   The validation schema implementation was not provided. Verify field allowlists, numeric limits, status values, unknown-key handling, and database constraints.

5. CASCADE AND RETENTION:
   Foreign-key definitions and delete actions were not provided. Review deletion behavior for properties, profiles, inquiries, sponsors, and property_sponsors.

Overall assessment: Security cannot be signed off until the client configuration, table grants, ownership, RLS policies, constraints, and foreign-key actions have been verified.

FINDING 2.1 — Database Client Privilege Boundary

Evidence:

- auth.getUser(token) validates the supplied token.
- Subsequent database operations use the imported supabaseClient.

Risk:
Validating a token separately does not automatically cause subsequent database queries to execute with that user's database identity. A privileged client may bypass RLS.

Recommendation:

- Inspect supabaseClient initialization.
- Use a request-scoped client carrying the user's JWT for user-authorized operations.
- Restrict service-role and secret keys to trusted server-side operations.
- Test actual database behavior with anonymous and authenticated users.

Status: UNVERIFIED; configuration not provided.

FINDING 2.2 — Listing Ownership and Status

Evidence:
The POST endpoint inserts validData, then overrides owner_id and status.

Risk:
These overrides protect this API path but do not necessarily protect direct database writes or other API endpoints.

Recommendation:

- Enforce ownership using auth.uid() and RLS.
- Prevent ordinary users from changing owner_id.
- Restrict publication transitions to authorized workflows.
- Review all INSERT and UPDATE policies.

Status: PARTIALLY MITIGATED IN APPLICATION CODE; DATABASE ENFORCEMENT UNVERIFIED.

FINDING 2.3 — Public Listing Visibility

Evidence:
GET selects properties where status = 'active'.

Risk:
The endpoint intentionally retrieves active listings, but the intended public visibility and exposed fields must be confirmed. RLS must independently enforce the desired access model.

Recommendation:

- Test anonymous and authenticated access.
- Review SELECT policies.
- Ensure private inquiries and other sensitive tables cannot be accessed through equivalent paths.

Status: REQUIRES ACCESS-MODEL CONFIRMATION.

FINDING 2.4 — Error Handling

Evidence:
Database failures return HTTP 500. A broad catch returns HTTP 400.

Risk:
Unexpected internal failures may be misclassified as client errors.

Recommendation:
Return 400 for malformed JSON and validation failures, 401 for authentication failures, and 500 for unexpected server errors. Avoid exposing sensitive SQL details in client responses.

Status: IMPROVEMENT RECOMMENDED.

FINDING 3.1 — Privileged Test Identity

Evidence:
The seed creates a profile with role = 'admin'.

Risk:
If the seed runs against a non-disposable database, it creates a privileged application identity.

Recommendation:

- Run only against controlled test environments unless explicitly approved.
- Never reuse test identities as production credentials.
- Verify that the role is not user-editable.

Status: ENVIRONMENT AND POLICY REVIEW REQUIRED.

FINDING 3.2 — Direct Writes to auth.users

Evidence:
The seed inserts directly into auth.users.

Risk:
This depends on Supabase Auth schema details, required fields, triggers, and implementation behavior.

Recommendation:
Prefer supported Auth administration APIs for provisioning test users, or a controlled local-only fixture.

Status: REVIEW REQUIRED.

FINDING 3.3 — Non-Idempotent Fixture Data

Evidence:
Users and profiles use ON CONFLICT DO NOTHING, but later property, sponsor, link, and inquiry inserts do not consistently use conflict handling.

Risk:
Repeated execution can produce partial or inconsistent fixtures.

Recommendation:

- Wrap fixture operations in a transaction where practical.
- Define deterministic cleanup.
- Assert final fixture state and expected role assignments.
- Use a disposable test database.

Status: IMPROVEMENT RECOMMENDED.

FINDING 3.4 — Referential Integrity

Evidence:
The seed creates properties, sponsors, property-sponsor links, and inquiries.

Risk:
Foreign-key definitions and deletion actions are not included.

Recommendation:
Inspect all foreign keys, referenced columns, delete actions, and retention requirements.

Status: UNVERIFIED.

TEST 4.1 — Role Privileges

Run using an authorized administrative connection:

SELECT
rolname,
rolsuper,
rolcreaterole,
rolcreatedb,
rolreplication,
rolbypassrls,
rolcanlogin
FROM pg_roles
WHERE rolname IN (
'anon',
'authenticated',
'service_role',
'postgres'
)
ORDER BY rolname;

Expected:

- anon and authenticated are not superusers.
- Ordinary application roles do not have BYPASSRLS.
- Privileged roles are restricted to trusted operations.

Note:
service_role must be treated as privileged. Do not assume it is safe because it is not a superuser.

TEST 4.2 — Table Ownership and RLS Flags

SELECT
n.nspname AS schema_name,
c.relname AS table_name,
pg_get_userbyid(c.relowner) AS table_owner,
c.relrowsecurity AS rls_enabled,
c.relforcerowsecurity AS rls_forced
FROM pg_class AS c
JOIN pg_namespace AS n
ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

Expected:
Protected tables have an intentional owner and RLS configuration. Ordinary application roles should not own protected tables.

TEST 4.3 — Table Grants

SELECT
grantee,
table_schema,
table_name,
privilege_type,
is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN (
'properties',
'profiles',
'inquiries',
'sponsors',
'property_sponsors'
)
ORDER BY table_name, grantee, privilege_type;

Expected:
Only intended roles receive INSERT, UPDATE, DELETE, and other privileges. Review grants alongside RLS policies.

TEST 4.4 — RLS Policy Inventory

SELECT
schemaname,
tablename,
policyname,
permissive,
roles,
cmd,
qual,
with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

Review:

- Policy role scope.
- SELECT visibility.
- INSERT WITH CHECK.
- UPDATE USING and WITH CHECK.
- DELETE restrictions.
- Overlapping permissive policies.
- Policies that trust user-editable roles or metadata.

IMPORTANT:
Run only against a disposable test database. Replace all placeholders with valid test UUIDs. Execute with a test connection that can SET ROLE authenticated. Use a test runner to assert row counts and expected errors.

TEST 5.1 — Prevent Self-Promotion to Admin

BEGIN;

SET LOCAL ROLE authenticated;

SELECT set_config(
'request.jwt.claim.sub',
'\<ALICE_USER_UUID>',
true
);

SELECT set_config(
'request.jwt.claims',
'{"sub":"\<ALICE_USER_UUID>","role":"authenticated"}',
true
);

UPDATE public.profiles
SET role = 'admin'
WHERE id = '\<ALICE_USER_UUID>';

SELECT id, role
FROM public.profiles
WHERE id = '\<ALICE_USER_UUID>';

ROLLBACK;

Expected:
Alice remains role = 'user'. The update should affect zero rows or return an authorization error.

TEST 5.2 — Prevent Cross-User Property Insertion

BEGIN;

SET LOCAL ROLE authenticated;

SELECT set_config(
'request.jwt.claim.sub',
'\<ALICE_USER_UUID>',
true
);

SELECT set_config(
'request.jwt.claims',
'{"sub":"\<ALICE_USER_UUID>","role":"authenticated"}',
true
);

INSERT INTO public.properties (
id,
owner_id,
property_id,
address,
city,
state,
zip_code,
price,
bedrooms,
bathrooms,
square_feet,
amenities,
status
)
VALUES (
'\<TEST_PROPERTY_UUID>',
'\<BOB_USER_UUID>',
'TEST-OWNERSHIP-001',
'100 Test Street',
'Austin',
'TX',
'78701',
100000,
2,
1,
900,
ARRAY[]::text[],
'draft'
);

ROLLBACK;

Expected:
The insert is rejected because Alice cannot create a property owned by Bob.

A foreign-key error alone does not prove RLS works. Verify the rejection is caused by the intended authorization control.

TEST 5.3 — Prevent Unauthorized Ownership Transfer

BEGIN;

SET LOCAL ROLE authenticated;

SELECT set_config(
'request.jwt.claim.sub',
'\<ALICE_USER_UUID>',
true
);

SELECT set_config(
'request.jwt.claims',
'{"sub":"\<ALICE_USER_UUID>","role":"authenticated"}',
true
);

UPDATE public.properties
SET owner_id = '\<BOB_USER_UUID>'
WHERE id = '\<ALICE_PROPERTY_UUID>'
AND owner_id = '\<ALICE_USER_UUID>';

SELECT id, owner_id
FROM public.properties
WHERE id = '\<ALICE_PROPERTY_UUID>';

ROLLBACK;

Expected:
Alice cannot transfer the property to Bob. If ownership changes, investigate UPDATE grants, RLS policies, triggers, and connection identity.

TEST 5.4 — Prevent Unauthorized Publication

Repeat the property INSERT test using:

- owner_id = '\<ALICE_USER_UUID>'
- status = 'active'

Expected:
The insert is rejected if publication requires privileged authorization.

Required validation checks:

- owner_id cannot be supplied as an authoritative client field.
- status must be restricted to documented values.
- Negative prices must be rejected.
- Bedrooms and square footage must meet business rules.
- Property identifiers must satisfy uniqueness requirements.
- Amenities must have appropriate value and size limits.
- Address fields must meet required-field and length requirements.
- Malformed JSON and oversized request bodies must be handled safely.

Illustrative database constraints:

ALTER TABLE public.properties
ADD CONSTRAINT properties_price_nonnegative
CHECK (price >= 0),
ADD CONSTRAINT properties_bedrooms_nonnegative
CHECK (bedrooms >= 0),
ADD CONSTRAINT properties_square_feet_nonnegative
CHECK (square_feet >= 0),
ADD CONSTRAINT properties_status_valid
CHECK (
status IN ('draft', 'active', 'sold', 'archived')
);

IMPORTANT:
Apply only after confirming column types, allowed statuses, NULL handling, and existing data. These are examples, not a verified migration.

TEST 6.1 — Reject Negative Price

BEGIN;

INSERT INTO public.properties (
owner_id,
property_id,
address,
city,
state,
zip_code,
price,
bedrooms,
bathrooms,
square_feet,
status
)
VALUES (
'\<ALICE_USER_UUID>',
'TEST-NEGATIVE-PRICE',
'100 Test Street',
'Austin',
'TX',
'78701',
-1,
2,
1,
900,
'draft'
);

ROLLBACK;

Expected:
The insert fails with the intended check-constraint violation.

Run equivalent tests for negative bedrooms, negative square footage, and invalid statuses.

TEST 7.1 — Inventory Foreign Keys

SELECT
ns.nspname AS schema_name,
tbl.relname AS table_name,
con.conname AS constraint_name,
pg_get_constraintdef(con.oid) AS definition,
CASE con.confdeltype
WHEN 'a' THEN 'NO ACTION'
WHEN 'r' THEN 'RESTRICT'
WHEN 'c' THEN 'CASCADE'
WHEN 'n' THEN 'SET NULL'
WHEN 'd' THEN 'SET DEFAULT'
END AS delete_action
FROM pg_constraint AS con
JOIN pg_class AS tbl
ON tbl.oid = con.conrelid
JOIN pg_namespace AS ns
ON ns.oid = tbl.relnamespace
WHERE con.contype = 'f'
AND ns.nspname IN ('public', 'auth')
ORDER BY ns.nspname, tbl.relname, con.conname;

Review relationships involving:

- properties.owner_id
- inquiries.profile_id
- inquiries.property_id
- property_sponsors.property_id
- property_sponsors.sponsor_id

Confirm the actual referenced columns before deciding on delete behavior.

Recommended considerations:

- Property-to-link cascades may be appropriate.
- Property-to-inquiry cascades may destroy records needed for auditing.
- User deletion must have an explicit property-retention policy.
- Sponsor deletion should not be available to unauthorized users.
- Inquiry history may require retention or anonymization.

TEST 7.2 — Inspect Property Deletion Effects

BEGIN;

DELETE FROM public.properties
WHERE id = '\<TEST_PROPERTY_UUID>';

SELECT \*
FROM public.inquiries
WHERE property_id = '\<TEST_PROPERTY_UUID>';

SELECT \*
FROM public.property_sponsors
WHERE property_id = '\<TEST_PROPERTY_UUID>';

ROLLBACK;

Expected:
Deletion behavior matches the documented retention policy.

Use disposable fixture records. Inspect triggers and asynchronous workers separately because transaction rollback does not necessarily reverse external side effects.

Use only a test environment and placeholder credentials.

Environment variables:

export SUPABASE_URL='\<TEST_SUPABASE_URL>'
export SUPABASE_PUBLISHABLE_KEY='\<TEST_PUBLISHABLE_KEY>'
export ALICE_ACCESS_TOKEN='\<ALICE_TEST_ACCESS_TOKEN>'
export BOB_ACCESS_TOKEN='\<BOB_TEST_ACCESS_TOKEN>'
export TEST_API_URL='\<TEST_APPLICATION_URL>'

Never commit credentials or expose service-role and secret keys to browser code.

TEST 8.1 — Anonymous Listing Creation

curl -i -X POST "$TEST_API_URL/api/listings" 
-H 'Content-Type: application/json' 
-d '{
"property_id": "TEST-ANON-001",
"address": "100 Test Street",
"city": "Austin",
"state": "TX",
"zip_code": "78701",
"price": 100000,
"bedrooms": 2,
"bathrooms": 1,
"square_feet": 900,
"amenities": []
}'

Expected:
401 Unauthorized.

TEST 8.2 — Attempt to Spoof Owner and Status

curl -i -X POST "$TEST_API_URL/api/listings" 
-H 'Content-Type: application/json' 
-H "Authorization: Bearer $ALICE_ACCESS_TOKEN" 
-d '{
"property_id": "TEST-SPOOF-001",
"address": "100 Test Street",
"city": "Austin",
"state": "TX",
"zip_code": "78701",
"price": 100000,
"bedrooms": 2,
"bathrooms": 1,
"square_feet": 900,
"amenities": [],
"owner_id": "\<BOB_USER_UUID>",
"status": "active"
}'

Expected:
Either a validation failure because the extra fields are rejected, or a successful insertion with Alice as owner and status = 'draft'.

Verify the persisted row using an authorized test connection.

TEST 8.3 — Invalid Token

curl -i -X POST "$TEST_API_URL/api/listings" 
-H 'Content-Type: application/json' 
-H 'Authorization: Bearer \<INVALID_TEST_TOKEN>' 
-d '{}'

Expected:
401 Unauthorized.

PRIORITY 1:
Verify Supabase client initialization and whether database requests execute with the user's JWT or a privileged key.

PRIORITY 2:
Audit RLS policies, table grants, role memberships, and table ownership. Confirm users cannot change profiles.role, property ownership, or privileged status fields.

PRIORITY 3:
Enforce database-level validation and authorization invariants. Review all alternate write paths.

PRIORITY 4:
Inventory foreign keys, cascades, triggers, and deletion retention requirements.

PRIORITY 5:
Automate negative security tests for anonymous access, cross-user access, role escalation, ownership transfer, invalid data, and cascade effects.

The supplied API route includes useful application-level controls: token validation, payload validation, owner binding, and forced draft status.

These controls do not prove database security.

The highest-priority unresolved questions are:

1. Does the database client bypass RLS?
2. Can a user modify their own profile role?
3. Can permissive RLS policies broaden access?
4. Can users reassign ownership or publish listings through another write path?
5. Can deletes cascade into inquiries or other records that must be retained?

Required artifacts for a complete security sign-off:

- CREATE TABLE and ALTER TABLE statements.
- All RLS policies.
- Table, sequence, and schema grants.
- Relevant functions and triggers.
- Supabase client initialization.
- Foreign-key definitions and delete actions.

Current status: PRELIMINARY REVIEW COMPLETE; DATABASE SECURITY SIGN-OFF PENDING SCHEMA AND POLICY VERIFICATION.
