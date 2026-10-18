import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock supabaseClient to isolate route validation and headers
vi.mock('../../src/lib/supabaseClient', () => ({
  supabaseClient: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Invalid token') }),
    },
  },
}));

import { POST } from '../../src/app/api/listings/route';

describe('POST /api/listings Route Handler', () => {
  it('returns 400 Bad Request when payload violates validation constraints', async () => {
    const invalidRequest = new NextRequest('http://localhost:3000/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: -50, city: 'A' }),
    });

    const response = await POST(invalidRequest);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('Validation failed');
    expect(body.details).toBeDefined();
  });

  it('returns 401 Unauthorized when Authorization header is absent', async () => {
    const validBody = {
      property_id: 'PROP-301',
      address: '789 Pine Road',
      city: 'Austin',
      state: 'TX',
      zip_code: '78704',
      price: 520000,
      bedrooms: 4,
      bathrooms: 3,
      square_feet: 2400,
      amenities: ['pool'],
    };

    const unauthenticatedRequest = new NextRequest('http://localhost:3000/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    });

    const response = await POST(unauthenticatedRequest);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toContain('Missing Authorization header');
  });
});
