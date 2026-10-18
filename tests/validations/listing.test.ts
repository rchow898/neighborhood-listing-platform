import { describe, it, expect } from 'vitest';
import { createListingSchema } from '../../src/lib/validations/listing';

describe('createListingSchema Validation Suite', () => {
  const validPayload = {
    property_id: 'PROP-201',
    address: '456 Oak Avenue',
    city: 'Austin',
    state: 'TX',
    zip_code: '78702',
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1650,
    amenities: ['garage', 'patio'],
  };

  it('accepts a fully compliant property listing payload', () => {
    const result = createListingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.property_id).toBe('PROP-201');
      expect(result.data.state).toBe('TX');
    }
  });

  it('rejects payloads with negative price', () => {
    const result = createListingSchema.safeParse({
      ...validPayload,
      price: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.price).toBeDefined();
    }
  });

  it('rejects malformed ZIP codes', () => {
    const result = createListingSchema.safeParse({
      ...validPayload,
      zip_code: 'INVALID-ZIP',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.zip_code).toBeDefined();
    }
  });

  it('rejects non-integer bedroom counts', () => {
    const result = createListingSchema.safeParse({
      ...validPayload,
      bedrooms: 2.5,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.bedrooms).toBeDefined();
    }
  });

  it('defaults amenities to an empty array when omitted', () => {
    const { amenities, ...payloadWithoutAmenities } = validPayload;
    const result = createListingSchema.safeParse(payloadWithoutAmenities);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amenities).toEqual([]);
    }
  });
});
