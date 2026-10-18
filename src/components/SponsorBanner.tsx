// src/components/SponsorBanner.tsx
import React from 'react';
import { Sponsor } from '../types';

interface SponsorBannerProps {
  sponsor: Sponsor;
}

export const SponsorBanner: React.FC<SponsorBannerProps> = ({ sponsor }) => {
  return (
    <aside
      aria-label="Sponsored advertisement"
      className="my-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-block rounded bg-amber-200 px-2 py-0.5 text-xs font-bold tracking-wide text-amber-800 uppercase">
            Sponsored
          </span>
          <p className="mt-1 font-semibold text-amber-900">{sponsor.businessName}</p>
          <p className="text-sm text-amber-800">{sponsor.tagline}</p>
        </div>
        <a
          href={sponsor.destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit sponsor website for ${sponsor.businessName} (opens in a new tab)`}
          className="rounded border border-amber-800 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
        >
          Learn More
        </a>
      </div>
    </aside>
  );
};