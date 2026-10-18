import { z } from 'zod';

export const createListingSchema = z.object({
  property_id: z.string().min(3).max(50),
  address: z.string().min(5).max(255),
  city: z.string().min(2).max(100),
  state: z.string().length(2).toUpperCase(),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, 'Must be a valid 5-digit or 9-digit ZIP code'),
  price: z.number().positive('Price must be greater than 0'),
  bedrooms: z.number().int().nonnegative('Bedrooms must be 0 or greater'),
  bathrooms: z.number().positive('Bathrooms must be greater than 0'),
  square_feet: z.number().int().positive('Square feet must be greater than 0'),
  amenities: z.array(z.string()).default([]),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;