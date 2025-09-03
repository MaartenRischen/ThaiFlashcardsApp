import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';

function isAdminEmail(email: string | undefined | null): boolean {
  const adminEnv = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const fixed = 'maartenrischen@protonmail.com';
  const candidate = (email || '').toLowerCase();
  return candidate === fixed || (!!adminEnv && candidate === adminEnv);
}

// DELETE: Remove a default set across ALL accounts (admin-only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { baseId: string } }
) {
  try {
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || '';
    if (!isAdminEmail(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const baseId = decodeURIComponent(params.baseId);
    if (!baseId) {
      return NextResponse.json({ error: 'Missing baseId' }, { status: 400 });
    }

    // Delete progress for all matching sets first
    await prisma.userSetProgress.deleteMany({
      where: {
        set: {
          source: 'default',
          OR: [
            { id: { startsWith: `${baseId}__` } },
            { id: baseId },
          ],
        },
      },
    });

    // Delete phrases for all matching sets
    await prisma.phrase.deleteMany({
      where: {
        flashcardSet: {
          source: 'default',
          OR: [
            { id: { startsWith: `${baseId}__` } },
            { id: baseId },
          ],
        },
      },
    });

    // Delete the sets themselves
    await prisma.flashcardSet.deleteMany({
      where: {
        source: 'default',
        OR: [
          { id: { startsWith: `${baseId}__` } },
          { id: baseId },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin default set DELETE failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


