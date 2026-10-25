import { z } from "zod";
import { SponsorPlacementSchema } from "./sponsor";

export const SponsorImpressionEventSchema = z.object({
  id: z.string().uuid(),
  sponsorId: z.string().uuid(),
  placement: SponsorPlacementSchema,
  timestamp: z.string().datetime(),
  pageContext: z.enum(["home_page", "search_results", "property_details"]),
});

export type SponsorImpressionEvent = z.infer<typeof SponsorImpressionEventSchema>;