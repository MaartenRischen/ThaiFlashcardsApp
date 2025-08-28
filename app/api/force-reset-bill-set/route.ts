import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    // This needs to work for both authenticated and unauthenticated users
    if (userId) {
      // For logged-in users, delete the database copy of this set
      const deleted = await prisma.flashcardSet.deleteMany({
        where: {
          userId,
          source: 'default',
          id: { in: ['default-common-sentences-2'] }
        }
      });
      
      console.log(`Deleted ${deleted.count} cached sets for user ${userId}`);
      
      // Also clear any saved mnemonics for this set
      await prisma.userMnemonic.deleteMany({
        where: {
          userId,
          setId: 'default-common-sentences-2'
        }
      });
    }
    
    // Return the fresh content
    const freshContent = getDefaultSetContent('default-common-sentences-2');
    
    return NextResponse.json({ 
      success: true,
      freshContent,
      message: 'Set has been reset to latest version'
    });

  } catch (error) {
    console.error('Error resetting set:', error);
    return NextResponse.json(
      { error: 'Failed to reset set' },
      { status: 500 }
    );
  }
}
