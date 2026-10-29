import React from 'react';

export interface PropertyCardProps {
    id: string;
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    square_feet: number;
    onSelect?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
    id,
    address,
    price,
    bedrooms,
    bathrooms,
    square_feet,
    onSelect,
}) => {
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(price);

    return (
        <article className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <header className="mb-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {address}
                </h2>
                <p className="mt-1 text-2xl font-semibold text-emerald-700">
                    {formattedPrice}
                </p>
            </header>

            <ul className="mb-6 space-y-1 text-sm text-slate-600">
                <li className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">Bedrooms:</span>
                    <span className="font-semibold text-slate-800">{bedrooms}</span>
                </li>
                <li className="flex items-center justify-between border-b border-slate-100 py-1">
                    <span className="font-medium text-slate-500">Bathrooms:</span>
                    <span className="font-semibold text-slate-800">{bathrooms}</span>
                </li>
                <li className="flex items-center justify-between py-1">
                    <span className="font-medium text-slate-500">Square Feet:</span>
                    <span className="font-semibold text-slate-800">
                        {square_feet.toLocaleString()} sq ft
                    </span>
                </li>
            </ul>

            <button
                type="button"
                onClick={() => onSelect && onSelect(id)}
                aria-label={`View details for ${address}`}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
                View Details
            </button>
        </article>
    );
};

export default PropertyCard;