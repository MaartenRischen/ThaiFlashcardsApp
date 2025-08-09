import { NextRequest, NextResponse } from 'next/server';
import { getTimings } from '@/app/lib/audioTimingsStore';

export async function GET(request: NextRequest, { params: _params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const reqId = url.searchParams.get('rid');
  if (!reqId) return NextResponse.json({ error: 'Missing rid' }, { status: 400 });
  const meta = getTimings(reqId);
  if (!meta) return NextResponse.json({ error: 'Not found or expired' }, { status: 404 });
  return NextResponse.json(meta);
}


