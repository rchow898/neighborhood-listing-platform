// src/types/index.ts

export interface Property {
  id: string;
  title: string;
  price: number;
  currency?: string; // Optional: defaults to USD if omitted
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  facts: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
  };
  imageUrl: string;
  imageAlt: string; // Required for WCAG image descriptions
}

export interface Sponsor {
  id: string;
  businessName: string;
  tagline: string;
  destinationUrl: string;
  logoUrl?: string;
}