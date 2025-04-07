import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      console.log("GET /api/flashcard-sets: Unauthorized - No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`GET /api/flashcard-sets: Authorized for user ${session.user.id}`);
    
    // Fetch the user's flashcard sets with count of phrases
    const sets = await prisma.flashcardSet.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc' // Most recently updated first
      },
      include: {
        _count: {
          select: {
            phrases: true
          }
        }
      }
    });
    
    return NextResponse.json({ sets });
    
  } catch (error) {
    console.error("Error fetching flashcard sets:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Define types for preprocessing
interface ExampleSentence {
  thai?: string;
  thaiMasculine?: string;
  thaiFeminine?: string;
  pronunciation?: string;
  translation?: string;
  english?: string;
  [key: string]: any; // Allow for any additional properties
}

interface PhraseData {
  english: string;
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  mnemonic?: string;
  examples?: ExampleSentence[];
  [key: string]: any; // Allow for any additional properties
}

// Define a more flexible examples schema to handle different formats
const exampleSentenceSchema = z.object({
  thai: z.string(),
  thaiMasculine: z.string().optional(), // Make optional with fallback
  thaiFeminine: z.string().optional(),  // Make optional with fallback 
  pronunciation: z.string().optional(), // Make optional with fallback
  translation: z.string().optional(),    // Allow either translation or english
  english: z.string().optional()        // Allow either translation or english
}).refine(data => {
  // Ensure at least one of translation or english is present
  return data.translation !== undefined || data.english !== undefined;
}, {
  message: "Either translation or english must be provided"
});

// Schema for validating new flashcard sets
const createSetSchema = z.object({
  name: z.string().min(1, "Set name is required"),
  cleverTitle: z.string().optional(),
  level: z.string().optional(),
  goals: z.array(z.string()).optional(),
  specificTopics: z.string().optional(),
  source: z.enum(["default", "wizard", "import"]),
  phrases: z.array(z.object({
    english: z.string(),
    thai: z.string(),
    thaiMasculine: z.string(),
    thaiFeminine: z.string(),
    pronunciation: z.string(),
    mnemonic: z.string().optional(),
    examples: z.array(exampleSentenceSchema).optional()
  }))
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      console.log("POST /api/flashcard-sets: Unauthorized - No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`POST /api/flashcard-sets: Authorized for user ${session.user.id}`);

    // Log the raw request body for debugging
    const rawBody = await req.json();
    console.log("Raw request body (phrases[0] example):", {
      ...rawBody,
      phrases: rawBody.phrases && rawBody.phrases.length > 0 
        ? [rawBody.phrases[0]] 
        : []
    });
    
    // Pre-process the data to normalize examples structure
    if (rawBody.phrases && Array.isArray(rawBody.phrases)) {
      rawBody.phrases = rawBody.phrases.map((phrase: PhraseData) => {
        if (phrase.examples && Array.isArray(phrase.examples)) {
          // Normalize examples to ensure they have all required fields
          phrase.examples = phrase.examples.map((example: ExampleSentence) => {
            return {
              thai: example.thai || "",
              thaiMasculine: example.thaiMasculine || example.thai || "",
              thaiFeminine: example.thaiFeminine || example.thai || "",
              pronunciation: example.pronunciation || "",
              translation: example.translation || example.english || ""
            };
          });
        }
        return phrase;
      });
    }
    
    // Validate input
    const result = createSetSchema.safeParse(rawBody);
    if (!result.success) {
      console.log("POST /api/flashcard-sets: Invalid input", result.error.format());
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    
    const { phrases, ...setData } = result.data;
    
    // Create the flashcard set with phrases
    console.log(`POST /api/flashcard-sets: Creating set "${setData.name}" with ${phrases.length} phrases`);
    const flashcardSet = await prisma.flashcardSet.create({
      data: {
        ...setData,
        userId: session.user.id,
        phrases: {
          create: phrases.map(phrase => {
            // Convert examples array to JSON if present
            const { examples, ...rest } = phrase;
            return {
              ...rest,
              examplesJson: examples ? examples : undefined
            };
          })
        }
      },
      include: {
        phrases: true
      }
    });
    
    console.log(`POST /api/flashcard-sets: Set created successfully with ID ${flashcardSet.id}`);
    return NextResponse.json(
      { message: "Flashcard set created successfully", set: flashcardSet },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating flashcard set:", error);
    return NextResponse.json(
      { error: "Something went wrong", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 