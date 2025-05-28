import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login(.*)',
  '/register(.*)',
  '/forgot-password(.*)',
  '/reset-password(.*)',
  '/api/share/(.*)', // Public share endpoints
  '/api/public-sets(.*)', // Public sets API
  '/api/health', // Health check endpoint
  '/api/env-check', // Environment check endpoint
  '/public-sets(.*)', // Public sets page
  '/share/(.*)', // Share pages
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth for public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 