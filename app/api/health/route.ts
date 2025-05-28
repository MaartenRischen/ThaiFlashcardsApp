import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Health check endpoint called');
    
    // If the server just started (uptime < 10 seconds), wait a bit for full initialization
    const uptime = process.uptime();
    if (uptime < 10) {
      console.log(`Server uptime is ${uptime}s, waiting for full initialization...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    }
    
    // Basic health check - just verify the server is responding
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: '1.0.1'
    };
    
    console.log('Health check successful:', healthData);
    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle POST requests in case the health checker uses POST
export async function POST() {
  return await GET();
}

// Handle HEAD requests for basic connectivity checks
export async function HEAD() {
  try {
    return new Response(null, { status: 200 });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
} 