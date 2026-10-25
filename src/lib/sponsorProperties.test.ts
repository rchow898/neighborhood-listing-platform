import { describe, expect, it } from "vitest";
import { selectSponsor, selectSponsorWithFallback } from "./sponsorSelector";
import { EligibilityContext, SponsorRecord } from "../types/sponsor";

describe("Step 13: Demonstration of Three Predictable Outcome Properties", () => {
  const context: EligibilityContext = {
    currentTime: new Date("2026-10-24T12:00:00.000Z"),
    placement: "listing_sidebar",
    zipCode: "90032",
  };

  const candidateA: SponsorRecord = {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Sponsor Alpha",
    status: "approved",
    isActive: true,
    priority: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    placement: "listing_sidebar",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    targetZipCodes: ["90032"],
    targetRadiusMiles: null,
    targetCoordinates: null,
    headline: "Alpha Services",
    creativeUrl: "https://example.com/alpha.png",
    destinationUrl: "https://alpha.example.com",
  };

  const candidateB: SponsorRecord = {
    ...candidateA,
    id: "44444444-4444-4444-8444-444444444444",
    name: "Sponsor Beta",
    priority: 1, // Lower priority
    createdAt: "2026-01-02T00:00:00.000Z",
  };

  // Property 1: Determinism (Invariance across N repeated executions)
  it("Property 1 (Determinism): produces identical outcomes across 50 consecutive runs", () => {
    const candidates = [candidateA, candidateB];
    const initialOutcome = selectSponsor(context, candidates);

    for (let i = 0; i < 50; i++) {
      const repeatedOutcome = selectSponsor(context, candidates);
      expect(repeatedOutcome?.id).toBe(initialOutcome?.id);
    }
  });

  // Property 2: Isolation (Permutation Invariance)
  it("Property 2 (Isolation): produces identical outcome regardless of input candidate order", () => {
    const order1 = [candidateA, candidateB];
    const order2 = [candidateB, candidateA];

    const outcome1 = selectSponsor(context, order1);
    const outcome2 = selectSponsor(context, order2);

    expect(outcome1?.id).toBe(outcome2?.id);
  });

  // Property 3: Totality and Safe Fallback Completeness
  it("Property 3 (Totality): delivers guaranteed valid PublicSponsor even on empty or unmatched pools", () => {
    // Subcase A: Empty candidate pool
    const emptyResult = selectSponsorWithFallback(context, []);
    expect(emptyResult).toBeDefined();
    expect(emptyResult.id).toMatch(/^00000000-0000-0000-0000-/);

    // Subcase B: Completely unmatched context
    const unmatchedContext: EligibilityContext = {
      ...context,
      zipCode: "00000",
    };
    const unmatchedResult = selectSponsorWithFallback(unmatchedContext, [candidateA]);
    expect(unmatchedResult).toBeDefined();
    expect(unmatchedResult.name).toBe("Neighborhood Community Board");
  });
});