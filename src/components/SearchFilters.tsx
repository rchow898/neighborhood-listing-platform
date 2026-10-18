// src/components/SearchFilters.tsx
import React from 'react';

interface SearchFiltersProps {
  onFilterSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterSubmit }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onFilterSubmit) onFilterSubmit(e);
  };

  return (
    <form
      role="search"
      aria-label="Property search filters"
      onSubmit={handleSubmit}
      className="mb-8 grid grid-cols-1 gap-4 rounded-lg bg-slate-100 p-4 sm:grid-cols-3"
    >
      <div className="flex flex-col">
        <label htmlFor="filter-property-type" className="text-sm font-medium text-slate-700">
          Property Type
        </label>
        <select
          id="filter-property-type"
          name="propertyType"
          className="mt-1 rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <option value="">All Types</option>
          <option value="single-family">Single Family</option>
          <option value="condo">Condo</option>
          <option value="townhouse">Townhouse</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="filter-min-beds" className="text-sm font-medium text-slate-700">
          Minimum Bedrooms
        </label>
        <select
          id="filter-min-beds"
          name="minBeds"
          className="mt-1 rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <option value="0">Any Bedrooms</option>
          <option value="1">1+ Bed</option>
          <option value="2">2+ Beds</option>
          <option value="3">3+ Beds</option>
          <option value="4">4+ Beds</option>
        </select>
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 py-2 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Apply Filters
        </button>
      </div>
    </form>
  );
};