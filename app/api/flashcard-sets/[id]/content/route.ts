import { NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
// import logger from '@/app/lib/logger';
import { z } from 'zod';
import * as storage from '@/app/lib/storage';
import { Phrase } from '@/app/data/phrases'; // Import Phrase type if needed

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const setId = params.id;

  // Use console.log for safety if logger is uncertain
  console.log(`API Route: /api/flashcard-sets/${setId}/content GET request received`);

  // Check for session and user.id existence
  if (!session?.user?.id) {
    console.warn(`API Route /api/flashcard-sets/${setId}/content GET: Unauthorized - No session or user ID`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id; // Access userId via session.user.id

  if (!setId) {
    console.warn(`API Route /api/flashcard-sets/${setId}/content GET: Bad Request - Missing setId`);
    return NextResponse.json({ error: "Set ID is required" }, { status: 400 });
  }

  try {
    console.log(`API Route /api/flashcard-sets/${setId}/content GET: Fetching content for user: ${userId}, setId: ${setId}`);
    // Assuming getSetContent only needs setId, userId check is for authorization above
    const content: Phrase[] | null = await storage.getSetContent(setId);

    if (!content) {
        console.warn(`API Route /api/flashcard-sets/${setId}/content GET: Content not found for setId: ${setId}`);
        return NextResponse.json({ error: "Set content not found" }, { status: 404 });
    }

    console.log(`API Route /api/flashcard-sets/${setId}/content GET: Content fetched successfully (${content.length} phrases).`);
    // Return the phrases array directly
    return NextResponse.json(content, { status: 200 });

  } catch (error: any) {
    console.error(`API Route /api/flashcard-sets/${setId}/content GET: Error fetching set content:`, error);
    return NextResponse.json(
      { error: "Failed to fetch set content", details: error.message },
      { status: 500 }
    );
  }
} 