import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';

export async function POST(_request: Request) {
  try {
    const { userId } = await auth();
    
    // This needs to work for both authenticated and unauthenticated users
    if (userId) {
      // For logged-in users, delete the database copy of this set
      // Try multiple approaches to ensure deletion
      const deleted1 = await prisma.flashcardSet.deleteMany({
        where: {
          userId,
          source: 'default',
          id: 'default-common-sentences-2'
        }
      });
      
      // Also try with name matching
      const deleted2 = await prisma.flashcardSet.deleteMany({
        where: {
          userId,
          name: '100 Most Used Thai Sentences 2'
        }
      });
      
      const totalDeleted = deleted1.count + deleted2.count;
      
      console.log(`Deleted ${totalDeleted} cached sets for user ${userId}`);
      
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
