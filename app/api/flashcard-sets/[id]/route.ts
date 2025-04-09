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
      phrases: set.phrases.map((phrase: any) => {
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

// --- NEW PUT Handler --- 

// Define a more comprehensive schema for PUT requests (replacing the whole set)
const exampleSentencePutSchema = z.object({
  thai: z.string(),
  thaiMasculine: z.string().optional(),
  thaiFeminine: z.string().optional(),
  pronunciation: z.string(),
  translation: z.string()
}).passthrough(); // Allow other fields just in case

const phrasePutSchema = z.object({
  id: z.string().optional(), // ID might exist if editing, but we recreate anyway
  english: z.string(),
  thai: z.string(),
  thaiMasculine: z.string().optional(),
  thaiFeminine: z.string().optional(),
  pronunciation: z.string(),
  mnemonic: z.string().optional().nullable(),
  examples: z.array(exampleSentencePutSchema).optional().nullable(),
}).passthrough(); // Allow other fields

const putSetSchema = z.object({
  // Include fields that might be updated alongside phrases
  name: z.string().min(1, "Set name is required"),
  level: z.string().optional(),
  specificTopics: z.string().optional(),
  source: z.string().optional(), // Keep track of source if needed
  cleverTitle: z.string().optional(),
  goals: z.array(z.string()).optional(),
  // Add other relevant fields from your Prisma schema if needed
  
  phrases: z.array(phrasePutSchema) // Validate the nested phrases array
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setId = params.id;
    const userId = session.user.id;

    // Prevent modification of the symbolic 'default' set via PUT
    if (setId === 'default') {
        return NextResponse.json(
            { error: "The default set cannot be modified directly via PUT." },
            { status: 400 }
        );
    }

    // Fetch the set first to ensure it exists and belongs to the user
    const existingSet = await prisma.flashcardSet.findUnique({
      where: { id: setId, userId: userId },
    });

    if (!existingSet) {
      return NextResponse.json(
        { error: "Set not found or not owned by user" },
        { status: 404 }
      );
    }

    const body = await req.json();
    
    // We expect the body to contain a 'set' object
    if (!body.set) {
        return NextResponse.json(
            { error: "Request body must contain a 'set' object." },
            { status: 400 }
        );
    }

    // Validate the incoming set data
    const validationResult = putSetSchema.safeParse(body.set);
    if (!validationResult.success) {
      console.error("PUT validation error:", validationResult.error.format());
      return NextResponse.json(
        { error: "Invalid input data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { phrases: validatedPhrases, ...setMetadata } = validationResult.data;

    // Perform the update within a transaction
    const updatedSet = await prisma.$transaction(async (tx) => {
      // 1. Update set metadata
      const updatedMetadata = await tx.flashcardSet.update({
        where: { id: setId },
        data: {
          name: setMetadata.name,
          level: setMetadata.level,
          specificTopics: setMetadata.specificTopics,
          cleverTitle: setMetadata.cleverTitle,
          goals: setMetadata.goals,
          // Add other metadata fields here if they are part of putSetSchema
        },
      });

      // 2. Delete existing phrases for this set
      await tx.phrase.deleteMany({ where: { setId: setId } });

      // 3. Create new phrases
      if (validatedPhrases && validatedPhrases.length > 0) {
        await tx.phrase.createMany({
          data: validatedPhrases.map(phrase => ({
            setId: setId,
            english: phrase.english,
            thai: phrase.thai,
            // Provide default empty strings if optional fields are missing/null
            thaiMasculine: phrase.thaiMasculine || '',
            thaiFeminine: phrase.thaiFeminine || '',
            pronunciation: phrase.pronunciation,
            mnemonic: phrase.mnemonic || null, // Keep null if Prisma schema allows, otherwise ''
            // Ensure examples are stored as JSON
            examplesJson: phrase.examples ? JSON.parse(JSON.stringify(phrase.examples)) : [], 
          })),
        });
      }
      
      // Return the updated set metadata along with potentially new phrases count
      // Fetching the full set again might be needed if returning the whole object
      return updatedMetadata; 
    });

    // Optionally fetch the full set with phrases again to return it
    const finalSet = await prisma.flashcardSet.findUnique({
        where: { id: setId },
        include: { phrases: true },
    });
     // Transform phrases for the response
    const transformedSet = {
      ...finalSet,
      phrases: finalSet?.phrases.map((phrase: any) => {
        const { examplesJson, ...rest } = phrase;
        return {
          ...rest,
          examples: examplesJson || []
        };
      }) || []
    };

    return NextResponse.json({ 
      message: "Set updated successfully", 
      set: transformedSet 
    });

  } catch (error) {
    console.error("Error updating flashcard set (PUT):", error);
    // Check for specific Prisma errors if needed
    return NextResponse.json(
      { error: "Something went wrong during set update" },
      { status: 500 }
    );
  }
} 