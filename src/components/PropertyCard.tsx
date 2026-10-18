// src/components/PropertyCard.tsx
import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: property.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(property.price);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <img
        src={property.imageUrl}
        alt={property.imageAlt}
        className="h-48 w-full object-cover"
        loading="lazy"
      />
      <div className="flex flex-1 flex-col p-4">
        <header>
          <p className="text-xl font-bold text-slate-900">{formattedPrice}</p>
          <h3 className="text-lg font-semibold text-slate-800">{property.title}</h3>
        </header>

        <address className="mt-1 text-sm not-italic text-slate-600">
          {property.address.street}, {property.address.city}, {property.address.state} {property.address.zipCode}
        </address>

        <ul className="mt-3 flex gap-4 text-xs font-medium text-slate-500" aria-label="Key property facts">
          <li>{property.facts.bedrooms} Beds</li>
          <li>{property.facts.bathrooms} Baths</li>
          <li>{property.facts.squareFeet.toLocaleString()} sqft</li>
        </ul>

        <div className="mt-auto pt-4">
          <a
            href={`/properties/${property.id}`}
            aria-label={`View full details for ${property.title} on ${property.address.street}`}
            className="inline-block w-full rounded bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            View Details
          </a>
        </div>
      </div>
    </article>
  );
};