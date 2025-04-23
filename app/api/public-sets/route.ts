import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/public-sets
export async function GET(_req: Request) {
  console.log("API Route: /api/public-sets GET request received");
  try {
    // Fetch all sets with a shareId (publicly shared)
    const sets = await prisma.flashcardSet.findMany({
      where: { shareId: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        shareId: true,
        name: true,
        cleverTitle: true,
        level: true,
        goals: true,
        specificTopics: true,
        imageUrl: true,
        seriousnessLevel: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        phrases: { select: { id: true } },
      },
    });
    // Add phraseCount for each set
    const setsWithCount = sets.map(set => ({
      ...set,
      phraseCount: set.phrases.length,
      phrases: undefined // Remove phrase IDs from response
    }));
    return NextResponse.json({ sets: setsWithCount });
  } catch (error) {
    console.error("Error fetching public sets:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
} 