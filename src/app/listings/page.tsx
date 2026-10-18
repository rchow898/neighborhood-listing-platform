'use client';

import { useEffect, useState } from 'react';
import { fetchActiveListings, PropertyListing } from '../../lib/api/listings';

export default function ListingsPage() {
  const [listings, setListings] = useState<PropertyListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const data = await fetchActiveListings();
        if (isMounted) {
          setListings(data);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(
            err instanceof Error ? err.message : 'An unexpected error occurred.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-7xl pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Featured Neighborhood Listings
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Live property inventory retrieved from local database endpoints.
        </p>
      </header>

      <section className="mx-auto max-w-7xl" aria-label="Available Properties">
        {isLoading && (
          <div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
          >
            {[1, 2, 3].map((placeholder) => (
              <div
                key={placeholder}
                className="h-72 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700"
          >
            <p className="font-semibold">Unable to display listings</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {!isLoading && !errorMessage && listings.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <h2 className="text-lg font-medium text-gray-900">
              No active listings found
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no properties published under active status.
            </p>
          </div>
        )}

        {!isLoading && !errorMessage && listings.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-5">
                  <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-800">
                    {item.property_id}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">
                    {item.address}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.city}, {item.state} {item.zip_code}
                  </p>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xl font-bold text-gray-900">
                      ${item.price.toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-gray-600">
                      <span>{item.bedrooms} beds</span>
                      <span>{item.bathrooms} baths</span>
                      <span>{item.square_feet.toLocaleString()} sqft</span>
                    </div>
                  </div>

                  {item.amenities && item.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
