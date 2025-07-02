'use client';

import { useAuth, useUser, useClerk } from '@clerk/nextjs';

export default function ClerkDebugPage() {
  const { isLoaded: authLoaded, userId, sessionId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const clerk = useClerk();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Clerk Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Environment Variables</h2>
          <pre className="text-xs">
            {JSON.stringify({
              NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set (hidden)' : 'Not set',
              NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'Not set',
              NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'Not set',
              NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'Not set',
              NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'Not set',
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Auth State</h2>
          <pre className="text-xs">
            {JSON.stringify({
              authLoaded,
              userId,
              sessionId,
              userLoaded,
              userEmail: user?.primaryEmailAddress?.emailAddress,
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Clerk Instance</h2>
          <pre className="text-xs">
            {JSON.stringify({
              loaded: clerk.loaded,
              frontendApi: clerk.frontendApi || 'Not set',
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Window Location</h2>
          <pre className="text-xs">
            {typeof window !== 'undefined' ? JSON.stringify({
              href: window.location.href,
              origin: window.location.origin,
              pathname: window.location.pathname,
            }, null, 2) : 'SSR'}
          </pre>
        </div>
      </div>
    </div>
  );
} 