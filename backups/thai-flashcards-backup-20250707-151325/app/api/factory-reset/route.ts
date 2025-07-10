import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  try {
    const authResult = await auth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const userId = authResult.userId;

    // Delete all sets except the default
    const deletedSets = await prisma.flashcardSet.deleteMany({
      where: {
        userId: userId,
        NOT: { source: 'default' },
      },
    });

    // Delete all progress for this user (should cascade, but just in case)
    const deletedProgress = await prisma.userSetProgress.deleteMany({
      where: { userId: userId },
    });

    return NextResponse.json({
      message: `Deleted ${deletedSets.count} sets and ${deletedProgress.count} progress records for user ${userId}`,
      setsDeleted: deletedSets.count,
      progressDeleted: deletedProgress.count,
    });
  } catch (error) {
    console.error('Error during factory reset:', error);
    return NextResponse.json({ error: 'Failed to perform factory reset' }, { status: 500 });
  }
} 