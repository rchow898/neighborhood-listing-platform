# Sponsor Eligibility Rules & Tie-Breaker Specification

## 1. Explicit Eligibility Rules (Step 1)
A candidate sponsor record is considered **eligible** for selection if and only if all of the following boolean predicates evaluate to `true`:

1. **Review Status (`approved`)**:
   - The sponsor asset, copy, and destination URL must have passed administrative review (`status = 'approved'`).
   - Draft, rejected, or pending sponsors are excluded immediately.

2. **Operational State (`active`)**:
   - The campaign must be actively toggled on by the sponsor or account manager (`is_active = true`).

3. **Placement Targeting (`placement`)**:
   - The sponsor campaign's designated target slot must strictly match the current rendering placement context (e.g., `listing_sidebar`, `property_banner`, `search_header`).

4. **Temporal Validity (`date range`)**:
   - The runtime evaluation timestamp (`now()`) must satisfy:
     `campaign_start_date <= now() <= campaign_end_date`.

5. **Geographic Locality (`ZIP / radius`)**:
   - The sponsor must target either:
     - The explicit 5-digit ZIP code of the active context, OR
     - Fall within the campaign's defined radius (in miles) from the context's geographic coordinates.
   - Indiscriminate geographic targeting is constrained to predefined service regions to prevent non-compliant spatial delivery.

---

## 2. Deterministic Tie-Breaker Specification (Step 2)

### Chosen Strategy
When two or more sponsor records satisfy all eligibility criteria, candidate ranking is strictly deterministic using a two-tier evaluation:

1. **Primary Sort: Campaign Priority / Tier** (`priority DESC`)
   - Higher numeric priority values represent premium tiers (e.g., Tier 3 Gold > Tier 2 Silver > Tier 1 Standard).
2. **Secondary Tie-Breaker: Creation Timestamp & Stable ID** (`created_at ASC`, then `id ASC`)
   - If priority scores are identical, candidates are ordered ascending by `created_at` (favoring senior contracts), with the record UUID (`id ASC`) serving as the absolute tie-breaker.

### Why This Strategy Was Chosen
- **Automated Test Reproducibility**: Randomized selection (such as `ORDER BY RANDOM()`) causes test runners (e.g., Vitest) to be flaky. A deterministic order guarantees identical inputs produce identical chosen sponsors across all test runs.
- **Auditability**: Regulators, auditors, and project reviewers can inspect a candidate pool and verify precisely why Sponsor A was chosen over Sponsor B.
- **Fairness & Predictability**: Prevents starvation without relying on hidden state or unrecorded session cache.