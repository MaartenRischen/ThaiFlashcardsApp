import { NextResponse } from 'next/server';
import { getPublishedSetById, deletePublishedSet } from '@/app/lib/storage';
import { auth } from '@clerk/nextjs/server';
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
    const { sessionClaims } = await auth();
    const email = sessionClaims?.email as string | undefined;
    if (email !== 'rischenme@gmail.com') {
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