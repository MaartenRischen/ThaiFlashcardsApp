export function GET() {
  // Simple, synchronous health check that always works
  console.log(`Health check called - PORT: ${process.env.PORT}, NODE_ENV: ${process.env.NODE_ENV}`);
  return new Response('OK', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

export function POST() {
  return GET();
}

export function HEAD() {
  return new Response(null, { status: 200 });
} 