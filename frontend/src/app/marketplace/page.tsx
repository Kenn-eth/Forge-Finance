'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import Marketplace to avoid blocking navigation
const Marketplace = dynamic(() => import('@/components/Marketplace').then(mod => ({ default: mod.Marketplace })), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for this component to speed up navigation
});

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <Marketplace />
    </Suspense>
  );
}

