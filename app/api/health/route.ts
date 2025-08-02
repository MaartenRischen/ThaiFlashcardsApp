import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: "healthy", timestamp: new Date().toISOString() });
}

export function POST() {
  return GET();
}

export function HEAD() {
  return new Response(null, { status: 200 });
} 