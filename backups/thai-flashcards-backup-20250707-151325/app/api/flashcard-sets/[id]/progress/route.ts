import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as storage from '@/app/lib/storage';

interface RouteParams {
  params: {
    id: string; // set ID from the URL path
  };
}

// GET handler for fetching progress for a specific set and user
export async function GET(request: Request, { params }: RouteParams) {
  const { id: setId } = params;
  console.log(`API Route: /api/flashcard-sets/${setId}/progress GET request received`);
  const { userId } = await auth();

  if (!userId) {
    console.error(`API Route /api/flashcard-sets/${setId}/progress GET: Unauthorized`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!setId) {
    console.error(`API Route /api/flashcard-sets/[id]/progress GET: Missing set ID.`);
    return NextResponse.json({ error: 'Missing set ID' }, { status: 400 });
  }

  try {
    console.log(`API Route /api/flashcard-sets/${setId}/progress GET: Fetching progress for user: ${userId}`);
    // Fetch progress using storage function (safe on server)
    const progress = await storage.getSetProgress(userId, setId);
    console.log(`API Route /api/flashcard-sets/${setId}/progress GET: Progress fetched.`);
    // Return the progress object, which might be empty ({}) if none exists
    return NextResponse.json({ progress: progress || {} }, { status: 200 }); 
  } catch (error) {
    console.error(`API Route /api/flashcard-sets/${setId}/progress GET: Error fetching progress:`, error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// Placeholder for PUT handler (to save progress)
// export async function PUT(request: Request, { params }: RouteParams) {
//   // ... logic to save progress ...
// } 