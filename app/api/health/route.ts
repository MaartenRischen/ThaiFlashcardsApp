import { NextResponse } from 'next/server';

// Force dynamic responses and edge runtime
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Prevent response caching
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    // Return a simple response
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
} 