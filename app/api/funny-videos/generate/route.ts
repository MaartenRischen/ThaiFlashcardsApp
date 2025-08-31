import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

// Placeholder endpoint to integrate with a video generation provider via OpenRouter or external API.
// For now, it accepts a posted MP4 URL and stores it into the Supabase bucket so the app can pick it up.

const BUCKET = process.env.FUNNY_VIDEOS_BUCKET || 'funny-videos';

export async function POST(req: NextRequest) {
  try {
    const { url, filename } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const name = filename && typeof filename === 'string' ? filename : `donkey-bridge-${Date.now()}.mp4`;

    const supabase = getSupabaseAdmin();
    // Ensure bucket exists
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    // Fetch the remote file and upload into storage
    const resp = await fetch(url);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Failed to fetch remote video' }, { status: 400 });
    }
    const arrayBuf = await resp.arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(name, new Uint8Array(arrayBuf), {
      contentType: 'video/mp4',
      upsert: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(name)}`;
    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('[funny-videos/generate] Error:', error);
    return NextResponse.json({ error: 'Failed to store video' }, { status: 500 });
  }
}


