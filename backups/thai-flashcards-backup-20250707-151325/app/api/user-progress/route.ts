import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// Get progress for a specific set
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    // Get set ID from query params
    const url = new URL(req.url);
    const setId = url.searchParams.get('setId');
    if (!setId) {
      return NextResponse.json(
        { error: "Missing setId parameter" },
        { status: 400 }
      );
    }
    // Find the progress record
    const progress = await prisma.userSetProgress.findUnique({
      where: {
        userId_setId: {
          userId: userId,
          setId: setId
        }
      }
    });
    if (!progress) {
      // Return empty progress if not found (new user/set)
      return NextResponse.json({ progressData: {} });
    }
    return NextResponse.json({ progressData: progress.progressData });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// Schema for validating progress data
const progressSchema = z.object({
  setId: z.string().min(1, "Set ID is required"),
  progressData: z.record(z.object({
    srsLevel: z.number(),
    nextReviewDate: z.string(),
    lastReviewedDate: z.string(),
    difficulty: z.enum(["new", "hard", "good", "easy"]),
    repetitions: z.number(),
    easeFactor: z.number()
  }))
});

// Save progress for a specific set
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await req.json();
    // Validate input
    const result = progressSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }
    const { setId, progressData } = result.data;
    // Upsert the progress record (create if not exists, update if exists)
    const updatedProgress = await prisma.userSetProgress.upsert({
      where: {
        userId_setId: {
          userId: userId,
          setId: setId
        }
      },
      update: {
        progressData: progressData,
        lastAccessedAt: new Date()
      },
      create: {
        userId: userId,
        setId: setId,
        progressData: progressData,
        lastAccessedAt: new Date()
      }
    });
    return NextResponse.json({
      message: "Progress saved successfully",
      progress: updatedProgress
    });
  } catch (error) {
    console.error("Error saving user progress:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 