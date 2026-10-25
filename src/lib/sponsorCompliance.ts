import { EligibilityContext } from "../types/sponsor";

// Disallowed keys that must never be present in ad context or targeting parameters
const PROHIBITED_TRAIT_KEYS = [
  "race",
  "ethnicity",
  "religion",
  "gender",
  "sex",
  "sexual_orientation",
  "disability",
  "familial_status",
  "age",
  "income",
  "user_id",
  "userId",
  "fingerprint",
  "visitor_id",
] as const;

export class ComplianceViolationError extends Error {
  constructor(message: string) {
    super(`[Compliance Violation - Step 7]: ${message}`);
    this.name = "ComplianceViolationError";
  }
}

/**
 * Step 7: Audits and validates an incoming context to ensure it contains
 * no persistent user identity or protected demographic inferences.
 */
export function validateNonDiscriminatoryContext(
  context: EligibilityContext
): void {
  // Cast to Record<string, unknown> internally for runtime key auditing
  const contextRecord = context as unknown as Record<string, unknown>;
  const contextKeys = Object.keys(contextRecord);

  for (const key of contextKeys) {
    const normalizedKey = key.toLowerCase();
    const isProhibited = PROHIBITED_TRAIT_KEYS.some((prohibited) =>
      normalizedKey.includes(prohibited.toLowerCase())
    );

    if (isProhibited) {
      throw new ComplianceViolationError(
        `Disallowed targeting parameter or user identity detected: '${key}'. Targeting must strictly be contextual (ZIP, placement, timestamp).`
      );
    }
  }

  // Ensure ZIP format is non-specific (standard 5-digit)
  if (!/^\d{5}$/.test(context.zipCode)) {
    throw new ComplianceViolationError(
      `Invalid ZIP format: '${context.zipCode}'. Geographic targeting must use standard 5-digit postal regions.`
    );
  }
}