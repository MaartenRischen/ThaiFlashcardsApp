import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import * as storage from '@/app/lib/storage';
import { logger } from '@/app/lib/logger'; // Keep logger if it exists and works, otherwise use console
import { Phrase } from '@/app/data/phrases'; // Import Phrase type if needed

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth(); // Await auth()
  const setId = params.id;

  // Use console.log for safety if logger is uncertain
  console.log(`API Route: /api/flashcard-sets/${setId}/content GET request received`);

  if (!userId) {
    console.warn(`API Route /api/flashcard-sets/${setId}/content GET: Unauthorized - No userId`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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