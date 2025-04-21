import { NextResponse } from 'next/server';
import { getPublishedSetById } from '@/app/lib/storage';
// import { publishedSets } from '../route'; // REMOVED: Cannot import from other routes

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch published set' }, { status: 500 });
  }
} 