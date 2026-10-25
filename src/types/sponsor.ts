import { z } from "zod";

export const SponsorPlacementSchema = z.enum([
  "listing_sidebar",
  "property_banner",
  "search_header",
]);

export type SponsorPlacement = z.infer<typeof SponsorPlacementSchema>;

export const SponsorRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  isActive: z.boolean(),
  priority: z.number().int().nonnegative().default(1),
  createdAt: z.string().datetime(),
  placement: SponsorPlacementSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetZipCodes: z.array(z.string().regex(/^\d{5}$/)),
  targetRadiusMiles: z.number().positive().nullable(),
  targetCoordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .nullable(),
  headline: z.string().min(1),
  creativeUrl: z.string().url(),
  destinationUrl: z.string().url(),
});

export type SponsorRecord = z.infer<typeof SponsorRecordSchema>;

// Public view exposed to presentation layers (no internal notes, billing, or CRM details)
export const PublicSponsorSchema = SponsorRecordSchema.omit({
  status: true,
  isActive: true,
}).extend({
  id: z.string().uuid(),
  name: z.string(),
  headline: z.string(),
  creativeUrl: z.string().url(),
  destinationUrl: z.string().url(),
  placement: SponsorPlacementSchema,
  priority: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export type PublicSponsor = z.infer<typeof PublicSponsorSchema>;

export interface EligibilityContext {
  currentTime: Date;
  placement: SponsorPlacement;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Step 1: Checks whether a candidate strictly satisfies all eligibility rules.
 */
export function isSponsorEligible(
  sponsor: SponsorRecord,
  context: EligibilityContext
): boolean {
  if (sponsor.status !== "approved") return false;
  if (!sponsor.isActive) return false;
  if (sponsor.placement !== context.placement) return false;

  const nowMs = context.currentTime.getTime();
  const startMs = new Date(sponsor.startDate).getTime();
  const endMs = new Date(sponsor.endDate).getTime();
  if (nowMs < startMs || nowMs > endMs) return false;

  const matchesZip = sponsor.targetZipCodes.includes(context.zipCode);
  if (matchesZip) return true;

  if (sponsor.targetRadiusMiles && sponsor.targetCoordinates && context.coordinates) {
    const distance = computeDistanceInMiles(
      context.coordinates.latitude,
      context.coordinates.longitude,
      sponsor.targetCoordinates.latitude,
      sponsor.targetCoordinates.longitude
    );
    return distance <= sponsor.targetRadiusMiles;
  }

  return false;
}

/**
 * Step 2: Deterministic comparator.
 * Primary: priority DESC (higher priority first)
 * Secondary: createdAt ASC (older contract first)
 * Tertiary: id ASC (lexicographical tie-breaker)
 */
export function compareSponsorsDeterministic(
  a: SponsorRecord | PublicSponsor,
  b: SponsorRecord | PublicSponsor
): number {
  if (b.priority !== a.priority) {
    return b.priority - a.priority;
  }

  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  if (aCreated !== bCreated) {
    return aCreated - bCreated;
  }

  return a.id.localeCompare(b.id);
}

function computeDistanceInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}