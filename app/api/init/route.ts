import { NextResponse } from 'next/server';
import { initializeApp } from '@/app/lib/init';

export async function POST() {
  try {
    await initializeApp();
    return NextResponse.json({ success: true, message: 'App initialized successfully' });
  } catch (error) {
    console.error('Error during app initialization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize app' },
      { status: 500 }
    );
  }
} 