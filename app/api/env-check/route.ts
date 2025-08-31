import { NextResponse } from 'next/server';

export function GET() {
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // Database
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DIRECT_DATABASE_URL_EXISTS: !!process.env.DIRECT_DATABASE_URL,
      // Supabase
      NEXT_PUBLIC_SUPABASE_URL_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_EXISTS: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY_EXISTS: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      // Auth
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL_EXISTS: !!process.env.NEXTAUTH_URL,
      // Clerk
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_EXISTS: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      CLERK_SECRET_KEY_EXISTS: !!process.env.CLERK_SECRET_KEY,
      // AI APIs
      OPENROUTER_API_KEY_EXISTS: !!process.env.OPENROUTER_API_KEY,
      IDEOGRAM_API_KEY_EXISTS: !!process.env.IDEOGRAM_API_KEY,
      GEMINI_API_KEY_EXISTS: !!process.env.GEMINI_API_KEY,
      // Process info
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json(envCheck, { status: 200 });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    );
  }
} 