// Temporarily disable middleware to debug startup issues
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// // Define public routes that don't require authentication
// const isPublicRoute = createRouteMatcher([
//   '/',
//   '/sign-in(.*)',
//   '/sign-up(.*)',
//   '/api/share/(.*)', // Public share endpoints if you have any
//   '/api/gallery/(.*)', // Public gallery endpoints if you have any
//   '/api/health' // Add health check to public routes
// ]);

// // This example protects all routes including api/trpc routes
// // Please edit this to allow other routes to be public as needed.
// // See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
// export default clerkMiddleware(async (auth, req) => {
//   // Skip auth for health check
//   if (req.nextUrl.pathname === '/api/health') {
//     return;
//   }
  
//   if (!isPublicRoute(req)) {
//     await auth.protect();
//   }
// });

// // export const config = {
// //   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// // };

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log all incoming requests for debugging
  console.log(`[Middleware] ${request.method} ${request.url}`);
  
  // Special handling for health check
  if (request.nextUrl.pathname === '/api/health' || request.nextUrl.pathname === '/api/health/') {
    console.log('[Middleware] Health check request detected');
  }
  
  // Allow all requests through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 