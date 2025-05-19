import { NextResponse } from 'next/server';

// Force dynamic responses and edge runtime
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Prevent response caching
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(request: Request) {
  console.log(`[HEALTH CHECK API] Received request at ${new Date().toISOString()}`);
  console.log(`[HEALTH CHECK API] Request URL: ${request.url}`);
  console.log(`[HEALTH CHECK API] Request Headers:`, JSON.stringify(Object.fromEntries(request.headers.entries())));

  try {
    const responseBody = { status: 'ok', timestamp: new Date().toISOString() };
    console.log('[HEALTH CHECK API] Sending response:', JSON.stringify(responseBody));
    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0, s-maxage=0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[HEALTH CHECK API] Error generating health check response:', error);
    const errorResponseBody = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error during health check',
      timestamp: new Date().toISOString(),
    };
    console.error('[HEALTH CHECK API] Sending error response:', JSON.stringify(errorResponseBody));
    return NextResponse.json(errorResponseBody, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0, s-maxage=0',
        'Content-Type': 'application/json',
      },
    });
  }
} 