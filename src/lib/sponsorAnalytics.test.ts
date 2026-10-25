import { describe, expect, it } from "vitest";
import { createImpressionEvent, trackSponsorImpression, impressionBuffer } from "./sponsorAnalytics";

describe("Sponsor Telemetry (Step 9)", () => {
  it("creates a valid impression event with coarse context and no IP address", () => {
    // Valid RFC 4122 v4 UUID
    const sponsorId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
    const event = createImpressionEvent({
      sponsorId,
      placement: "listing_sidebar",
      pageContext: "property_details",
      timestamp: "2026-10-24T12:00:00.000Z",
    });

    expect(event.sponsorId).toBe(sponsorId);
    expect(event.placement).toBe("listing_sidebar");
    expect(event.pageContext).toBe("property_details");
    expect(event.timestamp).toBe("2026-10-24T12:00:00.000Z");

    // Explicit privacy invariant check: ensure no IP property exists
    expect("ip" in event).toBe(false);
    expect("ipAddress" in event).toBe(false);
    expect("userId" in event).toBe(false);
  });

  it("buffers impression event during tracking", () => {
    // Valid RFC 4122 v4 UUID
    const sponsorId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const initialCount = impressionBuffer.length;
    
    trackSponsorImpression({
      sponsorId,
      placement: "search_header",
      pageContext: "search_results",
    });

    expect(impressionBuffer.length).toBe(initialCount + 1);
  });
});