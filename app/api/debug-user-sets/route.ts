import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[DEBUG-USER-SETS] Checking sets for userId: ${userId}`);

    // Get user info from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const user = await clerkClient.users.getUser(userId);
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;

    console.log(`[DEBUG-USER-SETS] User email: ${userEmail}`);

    // Count total sets
    const totalSetsCount = await prisma.flashcardSet.count({
      where: { userId }
    });

    // Get all sets with details
    const allSets = await prisma.flashcardSet.findMany({
      where: { userId },
      include: {
        _count: {
          select: { phrases: true }
        },
        folder: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get folders
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: { flashcardSets: true }
        }
      }
    });

    // Check for any database connection issues
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;

    return NextResponse.json({
      success: true,
      userId,
      userEmail,
      dbConnectionTest: dbTest,
      summary: {
        totalSets: totalSetsCount,
        totalFolders: folders.length,
        defaultSets: allSets.filter(s => s.source === 'default').length,
        customSets: allSets.filter(s => s.source !== 'default').length,
        recentSets: allSets.slice(0, 5).map(s => ({
          id: s.id,
          name: s.name,
          source: s.source,
          createdAt: s.createdAt,
          phraseCount: s._count.phrases,
          folder: s.folder?.name
        }))
      },
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        isDefault: f.isDefault,
        setCount: f._count.flashcardSets
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DEBUG-USER-SETS] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
