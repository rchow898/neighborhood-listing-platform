import { describe, expect, it } from "vitest";
import { selectSponsor, selectSponsorWithFallback } from "./sponsorSelector";
import { EligibilityContext, SponsorRecord } from "../types/sponsor";

describe("selectSponsor (Step 8 Test Suite)", () => {
  const baseContext: EligibilityContext = {
    currentTime: new Date("2026-10-24T12:00:00Z"),
    placement: "listing_sidebar",
    zipCode: "90032",
    coordinates: {
      latitude: 34.0669,
      longitude: -118.1685,
    },
  };

  const sampleApprovedCandidate: SponsorRecord = {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Cal State LA Bookstore",
    status: "approved",
    isActive: true,
    priority: 1,
    createdAt: "2026-01-01T00:00:00Z",
    placement: "listing_sidebar",
    startDate: "2026-01-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    targetZipCodes: ["90032"],
    targetRadiusMiles: null,
    targetCoordinates: null,
    headline: "Campus Gear and Textbooks",
    creativeUrl: "https://example.com/ad1.png",
    destinationUrl: "https://example.com/bookstore",
  };

  // Test Case 1: Exact ZIP match
  it("selects sponsor with exact ZIP match", () => {
    const result = selectSponsor(baseContext, [sampleApprovedCandidate]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(sampleApprovedCandidate.id);
    expect(result?.name).toBe("Cal State LA Bookstore");
  });

  // Test Case 2: Nearby match (radius within range when ZIP does not match)
  it("selects sponsor with nearby radius match when ZIP does not match directly", () => {
    const nearbyCandidate: SponsorRecord = {
      ...sampleApprovedCandidate,
      id: "22222222-2222-2222-2222-222222222222",
      name: "Alhambra Coffee Roasters",
      targetZipCodes: ["91801"], // Different ZIP
      targetRadiusMiles: 5,
      targetCoordinates: {
        latitude: 34.0953, // ~2.5 miles from 34.0669
        longitude: -118.1270,
      },
    };

    const result = selectSponsor(baseContext, [nearbyCandidate]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(nearbyCandidate.id);
  });

  // Test Case 3: Inactive sponsor
  it("excludes inactive sponsors even if all targeting matches", () => {
    const inactiveCandidate: SponsorRecord = {
      ...sampleApprovedCandidate,
      isActive: false,
    };

    const result = selectSponsor(baseContext, [inactiveCandidate]);
    expect(result).toBeNull();
  });

  // Test Case 4: Expired campaign
  it("excludes expired campaigns where current date exceeds endDate", () => {
    const expiredCandidate: SponsorRecord = {
      ...sampleApprovedCandidate,
      startDate: "2025-01-01T00:00:00Z",
      endDate: "2025-12-31T23:59:59Z", // Past date relative to baseContext
    };

    const result = selectSponsor(baseContext, [expiredCandidate]);
    expect(result).toBeNull();
  });

  // Test Case 5: Deterministic tie-breaker
  it("resolves ties deterministically using priority, seniority, and ID order", () => {
    const candidateA: SponsorRecord = {
      ...sampleApprovedCandidate,
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "Sponsor Standard Tier",
      priority: 1,
      createdAt: "2026-02-01T00:00:00Z",
    };

    const candidateB: SponsorRecord = {
      ...sampleApprovedCandidate,
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "Sponsor Premium Tier",
      priority: 5, // Higher priority wins
      createdAt: "2026-03-01T00:00:00Z",
    };

    const candidateC: SponsorRecord = {
      ...sampleApprovedCandidate,
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      name: "Sponsor Older Standard Tier",
      priority: 1,
      createdAt: "2026-01-01T00:00:00Z", // Older than A with equal priority
    };

    // When B (priority 5) is present, B wins
    const resultHighPriority = selectSponsor(baseContext, [candidateA, candidateB]);
    expect(resultHighPriority?.id).toBe(candidateB.id);

    // Between A and C (both priority 1), older creation date C wins
    const resultSeniority = selectSponsor(baseContext, [candidateA, candidateC]);
    expect(resultSeniority?.id).toBe(candidateC.id);
  });

  // Test Case 6: No match (triggers null and house fallback)
  it("returns null when no sponsors qualify, and delivers fallback message", () => {
    const noMatchContext: EligibilityContext = {
      ...baseContext,
      zipCode: "99999", // Unmatched ZIP
      coordinates: undefined,
    };

    const result = selectSponsor(noMatchContext, [sampleApprovedCandidate]);
    expect(result).toBeNull();

    // Verify Step 5 fallback wrapper delivers the house banner
    const fallbackResult = selectSponsorWithFallback(noMatchContext, [sampleApprovedCandidate]);
    expect(fallbackResult).toBeDefined();
    expect(fallbackResult.name).toBe("Neighborhood Community Board");
  });
});