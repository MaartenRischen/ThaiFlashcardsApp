import { NextRequest, NextResponse } from 'next/server';
import { getSetContent } from '@/app/lib/storage/set-content';
import { auth } from '@clerk/nextjs/server';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: _userId } = await auth();
    const setId = params.id;

    if (!setId) {
      return NextResponse.json({ error: 'Set ID is required' }, { status: 400 });
    }

    // If this is a default set requested by an unauthenticated flow (IDs prefixed with "default-")
    // or the original "default" set, serve the predefined content directly.
    if (setId === 'default' || setId.startsWith('default-')) {
      const defaultPhrases = getDefaultSetContent(setId);
      if (defaultPhrases && defaultPhrases.length > 0) {
        return NextResponse.json(defaultPhrases);
      }
      return NextResponse.json({ error: 'Default set not found' }, { status: 404 });
    }

    // Otherwise, get content from the database
    const phrases = await getSetContent(setId);

    // If the DB has no phrases (e.g., default sets not seeded yet for this user),
    // attempt a graceful fallback to predefined default content when applicable
    if (!phrases || phrases.length === 0) {
      const maybeDefaultId = `default-${setId}`; // e.g., common-sentences-3 -> default-common-sentences-3
      const fallback = getDefaultSetContent(maybeDefaultId);
      if (fallback && fallback.length > 0) {
        return NextResponse.json(fallback);
      }
    }

    return NextResponse.json(phrases || []);
  } catch (error) {
    console.error('Error fetching set content:', error);
    return NextResponse.json({ error: 'Failed to fetch set content' }, { status: 500 });
  }
}