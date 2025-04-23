import { clerkMiddleware } from '@clerk/nextjs/server';

// Basic Clerk Middleware setup
export default clerkMiddleware();

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets and specific API routes like /api/auth/*.
  matcher: [ '/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}; 