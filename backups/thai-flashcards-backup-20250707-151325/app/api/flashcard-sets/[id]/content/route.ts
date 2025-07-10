import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// import logger from '@/app/lib/logger';
import * as storage from '@/app/lib/storage';
import { Phrase } from '@/app/data/phrases'; // Import Phrase type if needed

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Unknown error';
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const setId = params.id;

  // Use console.log for safety if logger is uncertain
  console.log(`API Route: /api/flashcard-sets/${setId}/content GET request received`);

  // Check for userId existence
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

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error(`API Route /api/flashcard-sets/${setId}/content GET: Error fetching set content:`, error);
    return NextResponse.json(
      { error: "Failed to fetch set content", details: message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  const setId = params.id;

  console.log(`API Route: /api/flashcard-sets/${setId}/content POST request received`);

  // Check for userId existence
  if (!userId) {
    console.warn(`API Route /api/flashcard-sets/${setId}/content POST: Unauthorized - No userId`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!setId) {
    console.warn(`API Route /api/flashcard-sets/${setId}/content POST: Bad Request - Missing setId`);
    return NextResponse.json({ error: "Set ID is required" }, { status: 400 });
  }

  try {
    const requestBody = await request.json();
    const phrases = requestBody.phrases;

    if (!Array.isArray(phrases)) {
      console.warn(`API Route /api/flashcard-sets/${setId}/content POST: Bad Request - Invalid phrases array`);
      return NextResponse.json({ error: "Invalid phrases array" }, { status: 400 });
    }

    console.log(`API Route /api/flashcard-sets/${setId}/content POST: Saving content for user: ${userId}, setId: ${setId}`);
    const contentSaved = await storage.saveSetContent(setId, phrases);

    if (!contentSaved) {
      throw new Error("Failed to save set content");
    }

    console.log(`API Route /api/flashcard-sets/${setId}/content POST: Content saved successfully (${phrases.length} phrases).`);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: unknown) {
    const message = getErrorMessage(error);
    console.error(`API Route /api/flashcard-sets/${setId}/content POST: Error saving set content:`, error);
    return NextResponse.json(
      { error: "Failed to save set content", details: message },
      { status: 500 }
    );
  }
} 