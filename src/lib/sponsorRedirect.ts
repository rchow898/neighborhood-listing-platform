import { SponsorRecord } from "../types/sponsor";

export interface RedirectResolutionSuccess {
  status: "redirect";
  destinationUrl: string;
}

export interface RedirectResolutionFailure {
  status: "error";
  code: "NOT_FOUND" | "NOT_APPROVED" | "UNTRUSTED_DESTINATION";
  message: string;
}

export type RedirectResolutionResult =
  | RedirectResolutionSuccess
  | RedirectResolutionFailure;

/**
 * Step 10: Validates redirect targets strictly against approved sponsor records
 * to prevent open-redirect vulnerabilities.
 */
export function resolveSponsorRedirect(
  sponsorId: string,
  candidateRecords: SponsorRecord[]
): RedirectResolutionResult {
  const sponsor = candidateRecords.find((s) => s.id === sponsorId);

  // 1. Assert sponsor exists
  if (!sponsor) {
    return {
      status: "error",
      code: "NOT_FOUND",
      message: `No sponsor record found for id: ${sponsorId}`,
    };
  }

  // 2. Assert sponsor is approved
  if (sponsor.status !== "approved") {
    return {
      status: "error",
      code: "NOT_APPROVED",
      message: `Sponsor ${sponsorId} is not approved for traffic delivery.`,
    };
  }

  // 3. Assert destination is a valid URL and matches the approved record URL
  try {
    const targetUrl = new URL(sponsor.destinationUrl);
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return {
        status: "error",
        code: "UNTRUSTED_DESTINATION",
        message: "Invalid protocol on destination URL.",
      };
    }
  } catch {
    return {
      status: "error",
      code: "UNTRUSTED_DESTINATION",
      message: "Destination URL is malformed.",
    };
  }

  return {
    status: "redirect",
    destinationUrl: sponsor.destinationUrl,
  };
}