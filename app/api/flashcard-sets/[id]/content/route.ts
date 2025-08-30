import { NextRequest, NextResponse } from 'next/server';
import { getSetContent } from '@/app/lib/storage/set-content';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const setId = params.id;

    if (!setId) {
      return NextResponse.json({ error: 'Set ID is required' }, { status: 400 });
    }

    // Get set content - this works for both authenticated and unauthenticated users
    // as default sets are available to everyone
    const phrases = await getSetContent(setId);

    if (!phrases) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    return NextResponse.json(phrases);
  } catch (error) {
    console.error('Error fetching set content:', error);
    return NextResponse.json({ error: 'Failed to fetch set content' }, { status: 500 });
  }
}