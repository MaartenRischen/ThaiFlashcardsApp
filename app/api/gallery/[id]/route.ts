import { NextResponse } from 'next/server';
import { publishedSets } from '../route'; // Import the in-memory store

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const setId = params.id;
  const set = publishedSets.find((s: any) => s.id === setId);

  if (!set) {
    return NextResponse.json({ error: 'Set not found' }, { status: 404 });
  }

  // Return the full set data, including content (phrases)
  return NextResponse.json(set);
} 