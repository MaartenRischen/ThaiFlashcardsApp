import { NextResponse } from 'next/server';
import { initializeApp } from '@/app/lib/init';

export async function GET() {
  try {
    // Initialize the app (storage bucket, etc.)
    await initializeApp();
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Initialization complete'
    }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/init:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}