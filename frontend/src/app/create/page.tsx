'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import form to avoid blocking navigation
const InvoiceCreationForm = dynamic(() => import('@/components/InvoiceCreationForm').then(mod => ({ default: mod.InvoiceCreationForm })), {
  loading: () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading form...</p>
      </div>
    </div>
  ),
  ssr: false, // Disable SSR for this component to speed up navigation
});

export default function CreateInvoicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Invoice Token</h1>
          <p className="text-gray-600">
            Create a new invoice token to raise funds from investors
          </p>
        </div>
        <Suspense fallback={
          <div className="max-w-2xl mx-auto p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <InvoiceCreationForm />
        </Suspense>
      </div>
    </div>
  );
}

