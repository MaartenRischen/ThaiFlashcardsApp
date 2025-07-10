import { NextResponse } from 'next/server';
import { getAllPublishedSets, publishSetToGallery } from '@/app/lib/storage';

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Failed to fetch published sets';
}

export async function GET() {
  try {
    const sets = await getAllPublishedSets();
    return NextResponse.json(sets);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const publishedSet = await publishSetToGallery(data);
    return NextResponse.json({ success: true, id: publishedSet.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
} 