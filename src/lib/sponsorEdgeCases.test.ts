import { describe, expect, it } from "vitest";
import { selectSponsor } from "./sponsorSelector";
import { resolveSponsorRedirect } from "./sponsorRedirect";
import { EligibilityContext, SponsorRecord } from "../types/sponsor";
import { ComplianceViolationError } from "./sponsorCompliance";

describe("Step 11 Adversarial Edge Case Suite", () => {
  const baseSponsor: SponsorRecord = {
    id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    name: "Adversarial Edge Realty",
    status: "approved",
    isActive: true,
    priority: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    placement: "listing_sidebar",
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-30T23:59:59.999Z",
    targetZipCodes: ["90032"],
    targetRadiusMiles: 10,
    targetCoordinates: {
      latitude: 34.0669,
      longitude: -118.1685,
    },
    headline: "Verified Real Estate",
    creativeUrl: "https://example.com/ad.png",
    destinationUrl: "https://trusted-realty.example.com/properties",
  };

  // Attack 1: Exact millisecond boundaries
  it("includes sponsor at exact end millisecond, but excludes at end + 1ms", () => {
    const exactEndContext: EligibilityContext = {
      currentTime: new Date("2026-06-30T23:59:59.999Z"),
      placement: "listing_sidebar",
      zipCode: "90032",
    };
    expect(selectSponsor(exactEndContext, [baseSponsor])).not.toBeNull();

    const pastEndContext: EligibilityContext = {
      currentTime: new Date("2026-07-01T00:00:00.000Z"),
      placement: "listing_sidebar",
      zipCode: "90032",
    };
    expect(selectSponsor(pastEndContext, [baseSponsor])).toBeNull();
  });

  // Attack 2: Compliance violation on non-standard ZIP formats
  it("rejects non-standard 5-digit ZIP inputs via compliance validator", () => {
    const invalidZipContext: EligibilityContext = {
      currentTime: new Date("2026-06-15T12:00:00.000Z"),
      placement: "listing_sidebar",
      zipCode: "90032-1234", // ZIP+4 not allowed by 5-digit standard rule
    };

    expect(() => selectSponsor(invalidZipContext, [baseSponsor])).toThrow(
      ComplianceViolationError
    );
  });

  // Attack 3: Zero distance coordinate matching
  it("safely evaluates candidate when coordinates are identical (distance = 0.0 miles)", () => {
    const zeroDistanceContext: EligibilityContext = {
      currentTime: new Date("2026-06-15T12:00:00.000Z"),
      placement: "listing_sidebar",
      zipCode: "99999", // Unmatched ZIP to force radius branch
      coordinates: {
        latitude: 34.0669,
        longitude: -118.1685,
      },
    };

    const result = selectSponsor(zeroDistanceContext, [baseSponsor]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe(baseSponsor.id);
  });

  // Attack 4: Identical priority and identical creation timestamps tie-breaking
  it("breaks ties deterministically using UUID string comparison when priority and createdAt match", () => {
    const candidateLowerUuid: SponsorRecord = {
      ...baseSponsor,
      id: "10000000-0000-4000-8000-000000000000",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const candidateHigherUuid: SponsorRecord = {
      ...baseSponsor,
      id: "20000000-0000-4000-8000-000000000000",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const context: EligibilityContext = {
      currentTime: new Date("2026-06-15T12:00:00.000Z"),
      placement: "listing_sidebar",
      zipCode: "90032",
    };

    const result = selectSponsor(context, [candidateHigherUuid, candidateLowerUuid]);
    expect(result?.id).toBe(candidateLowerUuid.id);
  });

  // Attack 5: Open-redirect javascript: protocol smuggling
  it("rejects untrusted javascript: protocols in destination redirect", () => {
    const maliciousSponsor: SponsorRecord = {
      ...baseSponsor,
      destinationUrl: "javascript:alert(document.cookie)",
    };

    const result = resolveSponsorRedirect(maliciousSponsor.id, [maliciousSponsor]);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("UNTRUSTED_DESTINATION");
    }
  });
});