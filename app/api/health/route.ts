import { NextResponse } from 'next/server';

export function GET() {
  return new Response('OK', { status: 200 });
} 