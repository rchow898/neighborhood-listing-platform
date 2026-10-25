import { SponsorImpressionEvent, SponsorImpressionEventSchema } from "../types/telemetry";
import { SponsorPlacement } from "../types/sponsor";

export interface RecordImpressionInput {
  sponsorId: string;
  placement: SponsorPlacement;
  pageContext: "home_page" | "search_results" | "property_details";
  timestamp?: string;
}

/**
 * Step 9: Records an impression event with minimal privacy-safe attributes:
 * sponsor ID, placement, timestamp, and coarse page context.
 * Excludes raw IP addresses and visitor fingerprints.
 */
export function createImpressionEvent(
  input: RecordImpressionInput
): SponsorImpressionEvent {
  const eventPayload = {
    id: crypto.randomUUID(),
    sponsorId: input.sponsorId,
    placement: input.placement,
    timestamp: input.timestamp ?? new Date().toISOString(),
    pageContext: input.pageContext,
  };

  // Validate strictly against schema to ensure no IP or sensitive fields bleed in
  return SponsorImpressionEventSchema.parse(eventPayload);
}

/**
 * In-memory buffer or remote sink dispatcher for telemetry events.
 */
export const impressionBuffer: SponsorImpressionEvent[] = [];

export function trackSponsorImpression(input: RecordImpressionInput): SponsorImpressionEvent {
  const event = createImpressionEvent(input);
  impressionBuffer.push(event);
  return event;
}