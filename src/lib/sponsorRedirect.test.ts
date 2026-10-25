import { describe, expect, it } from "vitest";
import { resolveSponsorRedirect } from "./sponsorRedirect";
import { SponsorRecord } from "../types/sponsor";

describe("Sponsor Redirect Route (Step 10)", () => {
  const approvedSponsor: SponsorRecord = {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "San Gabriel Valley Credit Union",
    status: "approved",
    isActive: true,
    priority: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    placement: "listing_sidebar",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    targetZipCodes: ["91775", "91776"],
    targetRadiusMiles: null,
    targetCoordinates: null,
    headline: "Low Rate First-Time Homebuyer Loans",
    creativeUrl: "https://example.com/ad.png",
    destinationUrl: "https://sgvcu.example.com/mortgage",
  };

  it("resolves approved destination URL successfully", () => {
    const result = resolveSponsorRedirect(approvedSponsor.id, [approvedSponsor]);
    expect(result.status).toBe("redirect");
    if (result.status === "redirect") {
      expect(result.destinationUrl).toBe("https://sgvcu.example.com/mortgage");
    }
  });

  it("rejects unknown sponsor IDs with NOT_FOUND", () => {
    const result = resolveSponsorRedirect("00000000-0000-0000-0000-000000000000", [
      approvedSponsor,
    ]);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("NOT_FOUND");
    }
  });

  it("blocks unapproved sponsors from redirecting", () => {
    const pendingSponsor: SponsorRecord = {
      ...approvedSponsor,
      id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      status: "pending",
    };

    const result = resolveSponsorRedirect(pendingSponsor.id, [pendingSponsor]);
    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.code).toBe("NOT_APPROVED");
    }
  });
});