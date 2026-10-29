# Feature Specification: Sponsor-Backed Property Listing & Inquiry Subsystem

## Overview
This subsystem manages the lifecycle of property listings, connects active tier-level sponsors to public listings, isolates user inquiry data, and provides administrative oversight.

---

## User Stories & Acceptance Criteria

### Story 1: Property Owner Draft Submission
- **Role**: Registered Property Owner
- **Story**: As a registered property owner, I want to submit listing drafts so that prospective buyers can review them once verified by administrative staff.
- **Acceptance Criteria**:
  - **Given** an authenticated property owner,
  - **When** submitting a listing payload to the platform,
  - **Then** the property record is persisted with `status = 'draft'` and linked to the owner's `auth.uid()`.

### Story 2: Public Inquirer Discovery & Isolated Inquiry
- **Role**: Prospective Neighborhood Resident (Public Inquirer)
- **Story**: As a prospective neighborhood resident, I want to view approved properties alongside their tier-level sponsors and submit an inquiry without seeing prior inquiries from other users.
- **Acceptance Criteria**:
  - **Given** an anonymous visitor,
  - **When** querying public listings,
  - **Then** only records with `status = 'approved'` and their associated active sponsors are returned.
  - **Given** an anonymous visitor submitting an inquiry for a property,
  - **When** the inquiry submission succeeds,
  - **Then** the visitor can only receive confirmation of their own submission and cannot select, read, or enumerate inquiries submitted by other users.

### Story 3: Platform Administrator Compliance Override
- **Role**: Platform Administrator
- **Story**: As a platform administrator, I want full override authority across all records and tables to conduct compliance audits.
- **Acceptance Criteria**:
  - **Given** an authenticated user with administrative claims (`role = 'admin'`),
  - **When** reading or mutating records across properties, sponsors, and inquiries tables,
  - **Then** the system grants unrestricted access across all rows, bypassing owner-level and public-only filter constraints.

---

## Traceability Matrix

| Story Identifier | Scope Estimate | Target Database Migration | Target Route Handler |
| :--- | :--- | :--- | :--- |
| **Story 1 (Property Owner)** | `Medium` | `supabase/migrations/20261029140000_exam_schema_persistence.sql` (`properties`, `profiles`) | `src/app/api/properties/route.ts` (`POST`) |
| **Story 2 (Public Inquirer)** | `Medium` | `supabase/migrations/20261029140000_exam_schema_persistence.sql` (`sponsors`, `property_sponsors`, `inquiries`) | `src/app/api/properties/route.ts` (`GET`), `src/app/api/inquiries/route.ts` (`POST`) |
| **Story 3 (Platform Admin)** | `Small` | `supabase/migrations/20261029140000_exam_schema_persistence.sql` (schema definitions & constraints) | `src/app/api/admin/audit/route.ts` (`GET`) |