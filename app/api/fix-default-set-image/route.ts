import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      console.error("API Route /api/fix-default-set-image POST: Unauthorized - No user ID.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`API Route /api/fix-default-set-image POST: Fixing default set image for user: ${userId}`);

    // Find the default set for this user
    const defaultSet = await prisma.flashcardSet.findFirst({
      where: {
        userId: userId,
        source: 'default'
      }
    });

    if (!defaultSet) {
      console.log(`No default set found for user ${userId}`);
      return NextResponse.json({ message: 'No default set found' }, { status: 404 });
    }

    // Update the imageUrl
    const updated = await prisma.flashcardSet.update({
      where: {
        id: defaultSet.id
      },
      data: {
        imageUrl: '/images/defaultnew.png'
      }
    });

    console.log(`Successfully updated default set image for user ${userId}`, updated);
    
    return NextResponse.json({ 
      message: 'Default set image updated successfully',
      set: {
        id: updated.id,
        name: updated.name,
        imageUrl: updated.imageUrl
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fixing default set image:', error);
    return NextResponse.json({ error: 'Failed to fix default set image' }, { status: 500 });
  }
}
