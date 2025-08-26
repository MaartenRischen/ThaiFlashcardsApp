import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createDefaultFolders, assignDefaultSetsToFolders } from '@/app/lib/storage/folders';

// POST: Initialize folders for a user
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create default folders
    await createDefaultFolders(userId);
    
    // Assign default sets to their appropriate folders
    await assignDefaultSetsToFolders(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing folders:', error);
    return NextResponse.json(
      { error: 'Failed to initialize folders' },
      { status: 500 }
    );
  }
}
