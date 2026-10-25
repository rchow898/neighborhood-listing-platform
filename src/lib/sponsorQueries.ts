import { EligibilityContext, PublicSponsor, SponsorRecord } from "../types/sponsor";

/**
 * Step 3: Returns eligible sponsors without exposing internal notes.
 * 
 * If using an ORM or direct DB client, the SQL equivalent is:
 * 
 * SELECT id, name, headline, creative_url, destination_url, placement, priority, created_at
 * FROM sponsors
 * WHERE status = 'approved'
 *   AND is_active = true
 *   AND placement = $1
 *   AND start_date <= $2
 *   AND end_date >= $2
 *   -- (explicitly omitting: internal_notes, billing_rate, account_manager_id)
 */
export async function getEligibleSponsorsQuery(
  context: EligibilityContext,
  fetchAllCandidates: () => Promise<SponsorRecord[]>
): Promise<PublicSponsor[]> {
  // Fetch raw records from data source
  const rawCandidates = await fetchAllCandidates();

  const nowMs = context.currentTime.getTime();

  // Filter at data-layer boundary using Step 1 eligibility predicates
  const eligible = rawCandidates.filter((sponsor) => {
    if (sponsor.status !== "approved") return false;
    if (!sponsor.isActive) return false;
    if (sponsor.placement !== context.placement) return false;

    const startMs = new Date(sponsor.startDate).getTime();
    const endMs = new Date(sponsor.endDate).getTime();
    if (nowMs < startMs || nowMs > endMs) return false;

    // ZIP match
    return sponsor.targetZipCodes.includes(context.zipCode);
  });

  // Strict projection: Map to PublicSponsor to strip internal fields
  return eligible.map((s) => ({
    id: s.id,
    name: s.name,
    headline: s.headline,
    creativeUrl: s.creativeUrl,
    destinationUrl: s.destinationUrl,
    placement: s.placement,
    priority: s.priority,
    createdAt: s.createdAt,
  }));
}