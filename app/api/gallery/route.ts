import { NextResponse } from 'next/server';
import { getAllPublishedSets, publishSetToGallery } from '@/app/lib/storage';

export async function GET() {
  try {
    const sets = await getAllPublishedSets();
    return NextResponse.json(sets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch published sets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const publishedSet = await publishSetToGallery(data);
    return NextResponse.json({ success: true, id: publishedSet.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to publish set' }, { status: 500 });
  }
} 