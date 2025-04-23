import { NextResponse } from 'next/server';

export async function GET(_request: Request) {
  // This endpoint simply returns a 200 OK status to indicate the server is running.
  // You could add more complex checks here later if needed (e.g., DB connection).
  console.log("Health check endpoint hit successfully."); // Optional: Log successful checks
  return NextResponse.json({ status: 'ok' }, { status: 200 });
} 