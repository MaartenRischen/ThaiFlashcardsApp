import { NextResponse } from 'next/server';
import { getPublishedSetById, deletePublishedSet } from '@/app/lib/storage';
import { currentUser, auth } from '@clerk/nextjs/server';
// import { publishedSets } from '../route'; // REMOVED: Cannot import from other routes

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Failed to fetch published set';
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const set = await getPublishedSetById(params.id);
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }
    return NextResponse.json(set);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Explicitly enforce authentication for deletions
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

    // Admin whitelist (extendable via env)
    const envAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const adminEmails = new Set([
      'maartenrischen@protonmail.com',
      envAdmin,
    ].filter(Boolean));

    if (!userEmail || !adminEmails.has(userEmail)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const success = await deletePublishedSet(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete set' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
} 