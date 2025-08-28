import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find and delete the bad "check bin" mnemonic for this user
    const deleted = await prisma.userMnemonic.deleteMany({
      where: {
        userId,
        setId: { startsWith: 'default-' },
        mnemonic: { contains: 'check bin' }
      }
    });

    console.log(`Deleted ${deleted.count} bad mnemonics for user ${userId}`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleted.count 
    });

  } catch (error) {
    console.error('Error clearing bad mnemonic:', error);
    return NextResponse.json(
      { error: 'Failed to clear bad mnemonic' },
      { status: 500 }
    );
  }
}
