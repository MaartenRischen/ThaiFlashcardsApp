import { NextResponse } from 'next/server';

export async function GET() {
  // This is a root-level health check endpoint for Railway
  console.log("Root health check endpoint hit successfully."); 
  return NextResponse.json({ status: 'ok' }, { status: 200 });
} 