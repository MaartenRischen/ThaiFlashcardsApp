import { NextResponse } from 'next/server';

// In-memory store for published sets
export let publishedSets: any[] = [];

export async function GET() {
  // Return all published sets (metadata only, not full content)
  return NextResponse.json(publishedSets.map(({ content, ...meta }) => meta));
}

export async function POST(req: Request) {
  const data = await req.json();
  const { title, description, content, author, imageUrl, cardCount } = data;
  if (!title || !description || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const id = Math.random().toString(36).substr(2, 9);
  const timestamp = new Date().toISOString();
  const set = { id, title, description, content, author: author || 'Anonymous', imageUrl, cardCount, timestamp };
  publishedSets.push(set);
  return NextResponse.json({ success: true, id });
} 