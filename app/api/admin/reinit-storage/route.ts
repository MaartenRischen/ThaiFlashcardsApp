import { NextResponse } from 'next/server';
import { initializeStorage } from '@/app/lib/imageStorage';
import { currentUser } from '@clerk/nextjs/server';

export async function POST() {
  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress;
  
  // Only allow admin user
  if (userEmail !== 'maartenrischen@protonmail.com') {
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