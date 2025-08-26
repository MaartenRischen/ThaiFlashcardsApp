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
  '/api/generate-placeholder-image', // Placeholder image generation endpoint
  '/api/test-default-sets', // Test endpoint for debugging
  '/api/generate-set(.*)', // Let route handle auth and return JSON 401
  '/public-sets(.*)', // Public sets page
  '/share/(.*)', // Share pages
  '/clerk-debug', // Debug page
  '/api/generate-sentence-images', // Temporary for generating sentence images
]);

export default clerkMiddleware(async (auth, req) => {
  const isPublic = isPublicRoute(req);
  const url = req.url;
  const pathname = new URL(url).pathname;
  
  // Log API route requests for debugging
  if (pathname.startsWith('/api/')) {
    console.log(`[MIDDLEWARE] API request: ${pathname}, isPublic: ${isPublic}`);
  }
  
  // Skip auth for public routes
  if (!isPublic) {
    console.log(`[MIDDLEWARE] Protecting route: ${pathname}`);
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 