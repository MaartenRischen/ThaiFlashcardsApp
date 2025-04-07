import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
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
          userId: session.user.id,
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
        userId: session.user.id // Ensure the set belongs to the user
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
    const transformedSet = {
      ...set,
      phrases: set.phrases.map(phrase => {
        const { examplesJson, ...rest } = phrase;
        return {
          ...rest,
          examples: examplesJson || []
        };
      })
    };
    
    return NextResponse.json({ set: transformedSet });
    
  } catch (error) {
    console.error("Error fetching flashcard set:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
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
        userId: session.user.id
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
    console.error("Error deleting flashcard set:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
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
    const session = await auth();
    
    if (!session || !session.user) {
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
        userId: session.user.id
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
    console.error("Error updating flashcard set:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 