import { NextResponse } from 'next/server';
import { initializeStorage } from '@/app/lib/imageStorage';
import { auth } from '@clerk/nextjs/server';

export async function POST() {
  const { userId } = await auth();
  
  // Only allow admin user
  if (userId !== 'user_2w7FgmYkPXUKYesPpqgxeAF7C1h') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await initializeStorage();
    if (success) {
      return NextResponse.json({ message: 'Storage reinitialized successfully' });
    } else {
      return NextResponse.json({ error: 'Failed to reinitialize storage' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error reinitializing storage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 