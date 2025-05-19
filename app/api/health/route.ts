import { NextResponse } from 'next/server';

// Force dynamic responses and edge runtime
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// Prevent response caching
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ status: 'ok' });
} 