# AI Collaboration Checkpoint: Contextual Sponsor Selection Engine

## 1. Prompt Pattern
> "Act as an adversarial tester for this contextual sponsor-selection function. Generate boundary cases involving dates, ZIP codes, empty data, ties, unapproved records, and unsafe URLs. Do not propose user profiling."

---

## 2. ChatGPT Collaboration Record

### Useful Output Accepted
- **Millisecond Timestamp Boundaries:** Recommended asserting exact millisecond inclusiveness (`now === end`) versus strict exclusion at `end + 1ms`.
- **Open-Redirect Protocol Smuggling:** Suggested verifying protocol validation beyond basic regex to actively reject pseudo-protocols such as `javascript:alert(1)` and data schemes.
- **Stable Tie-Breaking:** Advised utilizing string UUID comparison (`id.localeCompare`) as the definitive secondary tie-breaker after creation seniority.

### Rejected Output & Rationale
- **User Session Weighting:** Suggested storing session click history to dynamically downgrade repeat sponsors.
  - *Rejection Reason:* Violates the strict requirement against user profiling, individual tracking, and stateful side-effects under Fair Housing Act standards.
- **Fuzzy Proximity Fallbacks:** Suggested expanding non-matching ZIPs to neighboring metropolitan counties via dynamic external API lookups.
  - *Rejection Reason:* Breaks function purity and introduces nondeterministic network dependencies into the unit test suite.

---

## 3. Gemini Collaboration Record

### Useful Output Accepted
- **Zod Schema UUID Validation:** Enforced strict RFC 4122 v4 UUID compliance across telemetry models to avoid invalid mock strings in production event pipelines.
- **Totality & Complete House Fallback:** Ensured that when no commercial sponsor qualifies, `selectSponsorWithFallback` deterministically maps to standard house records (`DEFAULT_HOUSE_SPONSORS`) to prevent UI reflow.
- **Index Plan Optimization:** Formulated the partial composite index (`idx_sponsors_active_placement_dates`) targeting only active and approved records, reducing sequential scan page reads.

### Rejected Output & Rationale
- **IP Address Hashing:** Suggested storing a SHA-256 hashed client IP address in the telemetry record for unique impression accounting.
  - *Rejection Reason:* Strictly rejected to adhere to the zero-IP telemetry restraint guideline and avoid storing quasi-identifiers.

---

## 4. Verification & Commit Mapping
- **Boundary & Adversarial Tests:** Implemented in `src/lib/sponsorEdgeCases.test.ts`.
- **Telemetry Privacy Invariants:** Implemented in `src/lib/sponsorAnalytics.ts` and tested in `src/lib/sponsorAnalytics.test.ts`.
- **Safe URL Redirect Engine:** Implemented in `src/lib/sponsorRedirect.ts` and tested in `src/lib/sponsorRedirect.test.ts`.
- **Associated Commits:**
  - `feat(compliance): enforce fair housing rules and non-discriminatory context checks (step 7)`
  - `test(security): add adversarial edge-case regression tests from dual AI critique (step 11)`
  - `perf(database): document explain plan and add justified composite index (step 12)`