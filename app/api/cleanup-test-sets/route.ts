import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  try {
    const authResult = await auth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = authResult.userId;

    // Delete all test sets created in the last hour
    const result = await prisma.flashcardSet.deleteMany({
      where: {
        userId: userId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        },
        OR: [
          { name: { contains: "Test Set" } },
          { name: { contains: "giving directions" } },
          { name: { contains: "Custom Set" } }
        ]
      }
    });

    return NextResponse.json({ 
      message: `Deleted ${result.count} test sets`,
      count: result.count 
    });
  } catch (error) {
    console.error("Error cleaning up test sets:", error);
    return NextResponse.json({ error: "Failed to clean up test sets" }, { status: 500 });
  }
} 