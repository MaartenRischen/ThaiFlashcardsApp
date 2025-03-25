'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-4 text-center max-w-md">
        {error.message || 'An unexpected error occurred. Please try refreshing the page.'}
      </p>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Refresh Page
        </button>
        <button
          onClick={() => reset()}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
        >
          Try Again
        </button>
        <a
          href="/"
          className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-center w-full"
        >
          Return Home
        </a>
      </div>
    </div>
  );
} 