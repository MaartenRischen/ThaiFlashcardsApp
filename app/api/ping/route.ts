export function GET() {
  return new Response('pong', { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}

export function POST() {
  return GET();
}

export function HEAD() {
  return new Response(null, { status: 200 });
} 