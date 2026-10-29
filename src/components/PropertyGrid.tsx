import React from 'react';
import PropertyCard, { PropertyCardProps } from './PropertyCard';

interface PropertyGridProps {
    properties: PropertyCardProps[];
    onSelectProperty?: (id: string) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
    properties,
    onSelectProperty,
}) => {
    if (!properties || properties.length === 0) {
        return (
            <section className="py-12 text-center">
                <p className="text-slate-500">No approved properties currently available.</p>
            </section>
        );
    }

    return (
        <section aria-label="Available Properties" className="w-full">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                    <PropertyCard
                        key={property.id}
                        {...property}
                        onSelect={onSelectProperty}
                    />
                ))}
            </div>
        </section>
    );
};

export default PropertyGrid;