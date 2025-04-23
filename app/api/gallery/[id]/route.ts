import { NextResponse } from 'next/server';
import { getPublishedSetById } from '@/app/lib/storage';
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