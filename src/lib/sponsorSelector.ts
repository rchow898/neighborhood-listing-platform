import {
  EligibilityContext,
  PublicSponsor,
  SponsorRecord,
  compareSponsorsDeterministic,
  isSponsorEligible,
} from "../types/sponsor";

/**
 * Step 4: Pure selection function separated from rendering.
 * 
 * - Pure: No DOM access, no fetch/DB calls, no internal mutation.
 * - Deterministic: Always produces identical output for identical inputs.
 * 
 * @param context The active page, time, and geographic context
 * @param candidates The list of candidate sponsor records to evaluate
 * @returns The winning PublicSponsor or null if no candidate qualifies
 */
export function selectSponsor(
  context: EligibilityContext,
  candidates: SponsorRecord[]
): PublicSponsor | null {
  // 1. Filter candidates by explicit Step 1 eligibility rules
  const eligible = candidates.filter((sponsor) =>
    isSponsorEligible(sponsor, context)
  );

  if (eligible.length === 0) {
    return null;
  }

  // 2. Sort deterministically using Step 2 comparator without mutating original array
  const sorted = [...eligible].sort(compareSponsorsDeterministic);

  // 3. Select top-ranked candidate and project to PublicSponsor view
  const winner = sorted[0];

  return {
    id: winner.id,
    name: winner.name,
    headline: winner.headline,
    creativeUrl: winner.creativeUrl,
    destinationUrl: winner.destinationUrl,
    placement: winner.placement,
    priority: winner.priority,
    createdAt: winner.createdAt,
  };
}