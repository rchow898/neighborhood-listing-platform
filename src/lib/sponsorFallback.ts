import { PublicSponsor, SponsorPlacement } from "../types/sponsor";

/**
 * Standard House Fallback constants ensuring the UI has a safe default
 * when no commercial sponsor qualifies for the requested slot.
 */
export const DEFAULT_HOUSE_SPONSORS: Record<SponsorPlacement, PublicSponsor> = {
  listing_sidebar: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Neighborhood Community Board",
    headline: "Support Local Businesses in Your Community",
    creativeUrl: "/images/house/community-board.png",
    destinationUrl: "/about/community-partners",
    placement: "listing_sidebar",
    priority: 0,
    createdAt: "1970-01-01T00:00:00.000Z",
  },
  property_banner: {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Neighborhood Verified Housing",
    headline: "Explore Fair & Transparent Listings Across Los Angeles",
    creativeUrl: "/images/house/verified-housing.png",
    destinationUrl: "/standards/housing-fairness",
    placement: "property_banner",
    priority: 0,
    createdAt: "1970-01-01T00:00:00.000Z",
  },
  search_header: {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Neighborhood Housing Resource Hub",
    headline: "Need Assistance Navigating Local Property Resources?",
    creativeUrl: "/images/house/resource-hub.png",
    destinationUrl: "/resources/renter-guide",
    placement: "search_header",
    priority: 0,
    createdAt: "1970-01-01T00:00:00.000Z",
  },
};

/**
 * Step 5: Resolves a guaranteed sponsor view, falling back to a 
 * predefined house message if no candidate is eligible.
 */
export function getSponsorWithFallback(
  selectedSponsor: PublicSponsor | null,
  placement: SponsorPlacement
): PublicSponsor {
  if (selectedSponsor !== null) {
    return selectedSponsor;
  }

  return DEFAULT_HOUSE_SPONSORS[placement];
}