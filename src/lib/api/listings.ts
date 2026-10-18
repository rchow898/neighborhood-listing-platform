// src/lib/api/listings.ts

export interface PropertyListing {
  id: string;
  property_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  amenities: string[];
  status: 'draft' | 'pending' | 'active' | 'approved';
  created_at: string;
}

export interface GetListingsResponse {
  listings: PropertyListing[];
  error?: string;
}

export async function fetchActiveListings(): Promise<PropertyListing[]> {
  const response = await fetch('/api/listings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Failed to fetch listings: HTTP ${response.status}`
    );
  }

  const data: GetListingsResponse = await response.json();
  return data.listings ?? [];
}
