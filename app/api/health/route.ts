import { NextResponse } from 'next/server';

export function GET() {
  // Simple health check endpoint that returns immediately
  return new NextResponse(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'no-store'
      }
    }
  );
} 