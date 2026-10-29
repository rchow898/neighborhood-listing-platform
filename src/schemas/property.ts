import { z } from 'zod';

export const PropertyPayloadSchema = z
    .object({
        address: z.string().trim().min(5, { message: 'Address must be at least 5 characters long.' }),
        price: z.number().nonnegative({ message: 'Price must be a non-negative number.' }),
        bedrooms: z.number().int({ message: 'Bedrooms must be an integer.' }).nonnegative({ message: 'Bedrooms must be greater than or equal to 0.' }),
        bathrooms: z.number().nonnegative({ message: 'Bathrooms must be greater than or equal to 0.' }),
        square_feet: z.number().int({ message: 'Square feet must be an integer.' }).positive({ message: 'Square feet must be a positive integer.' }),
    })
    .strict();

export type PropertyPayload = z.infer<typeof PropertyPayloadSchema>;