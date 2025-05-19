import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/health',      // Root health check page
  '/api/health',  // API health check
  '/api/share/(.*)', // Public share endpoints
  '/api/gallery/(.*)' // Public gallery endpoints
]);

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return; // Allow public routes to pass through
  }
  // For all other routes, protect them.
  // auth.protect() will handle unauthenticated users, 
  // typically redirecting to sign-in or returning 401/403 for API routes.
  await auth.protect(); 
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 