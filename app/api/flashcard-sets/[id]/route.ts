import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import * as storage from '@/app/lib/storage';
import { SetMetaData } from '@/app/lib/storage';
import { Phrase } from '@/app/lib/set-generator';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Unknown error';
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const setId = params.id;
    
    // Check if it's the default set
    if (setId === 'default') {
      // For the default set, we'll return a predefined structure from the database
      // This should be created during initial setup or fetched from a constants file
      const defaultSet = await prisma.flashcardSet.findFirst({
        where: {
          userId: userId,
          source: 'default'
        },
        include: {
          phrases: true
        }
      });
      
      if (defaultSet) {
        return NextResponse.json({ set: defaultSet });
      } else {
        // If no default set exists for this user, return 404
        return NextResponse.json(
          { error: "Default set not found" },
          { status: 404 }
        );
      }
    }
    
    // Fetch the specific set with phrases
    const set = await prisma.flashcardSet.findUnique({
      where: {
        id: setId,
        userId: userId // Use userId here
      },
      include: {
        phrases: true
      }
    });
    
    if (!set) {
      return NextResponse.json(
        { error: "Set not found" },
        { status: 404 }
      );
    }
    
    // Transform the phrases to match the expected format
    type PrismaPhrase = {
      id: string;
      setId: string;
      english: string;
      thai: string;
      thaiMasculine: string;
      thaiFeminine: string;
      pronunciation: string;
      mnemonic?: string | null;
      examplesJson?: unknown;
      [key: string]: unknown;
    };
    const transformedSet = {
      ...set,
      phrases: set.phrases.map((phrase: PrismaPhrase) => {
        const { examplesJson, ...rest } = phrase;
        return {
          ...rest,
          examples: examplesJson || []
        };
      })
    };
    
    return NextResponse.json({ set: transformedSet });
    
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Error fetching flashcard set:", error);
    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const setId = params.id;
    
    // Don't allow deletion of default set
    if (setId === 'default') {
      return NextResponse.json(
        { error: "The default set cannot be deleted" },
        { status: 400 }
      );
    }
    
    // Find the set and verify ownership
    const set = await prisma.flashcardSet.findUnique({
      where: {
        id: setId,
        userId: userId // Use userId here
      }
    });
    
    if (!set) {
      return NextResponse.json(
        { error: "Set not found or not owned by user" },
        { status: 404 }
      );
    }
    
    // Delete the set (will cascade to phrases and progress due to relations)
    await prisma.flashcardSet.delete({
      where: {
        id: setId
      }
    });
    
    return NextResponse.json({ message: "Set deleted successfully" });
    
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Error deleting flashcard set:", error);
    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}

// Schema for validating update data
const updateSetSchema = z.object({
  name: z.string().min(1, "Set name is required").optional(),
  cleverTitle: z.string().optional(),
  level: z.string().optional(),
  goals: z.array(z.string()).optional(),
  specificTopics: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const setId = params.id;
    
    // Find the set and verify ownership
    const set = await prisma.flashcardSet.findUnique({
      where: {
        id: setId,
        userId: userId // Use userId here
      }
    });
    
    if (!set) {
      return NextResponse.json(
        { error: "Set not found or not owned by user" },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // Validate input
    const result = updateSetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    // Update the set
    const updatedSet = await prisma.flashcardSet.update({
      where: {
        id: setId
      },
      data: result.data,
    });
    
    return NextResponse.json({
      message: "Set updated successfully",
      set: updatedSet
    });
    
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Error updating flashcard set:", error);
    return NextResponse.json(
      { error: `Something went wrong: ${message}` },
      { status: 500 }
    );
  }
}

// POST handler for creating new sets
export async function POST(_request: Request) {
  // ... existing code ...
  try {
    // ... existing code ...
  } catch (error: unknown) {
    const message = getErrorMessage(error);
    // ... existing code ...
    return NextResponse.json({ error: `Set creation failed: ${message}` }, { status: 500 });
  }
} 