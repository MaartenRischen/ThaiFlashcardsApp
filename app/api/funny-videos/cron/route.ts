import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { funnyPromptVariants, generateDonkeyBridgeVideo } from '@/app/lib/openrouter-video';

const BUCKET = process.env.FUNNY_VIDEOS_BUCKET || 'funny-videos';
// Hardcoded fallback as requested; override via CRON_SECRET_KEY in env if desired
const CRON_KEY = process.env.CRON_SECRET_KEY || 'dbw-cron-2L9hJk7uYqN5sT3aX8wZ4mC1rV6pB2n';

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ')
      ? auth.substring('Bearer '.length).trim()
      : auth.trim();
    if (token !== CRON_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const variants = funnyPromptVariants(2); // generate a couple per run
    const results: string[] = [];

    for (const v of variants) {
      try {
        const { url } = await generateDonkeyBridgeVideo(v);
        // Fetch and store in bucket
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('fetch video failed');
        const buf = await resp.arrayBuffer();
        const filename = `donkey-bridge-${Date.now()}-${Math.random().toString(36).slice(2,8)}.mp4`;
        const { error } = await supabase.storage.from(BUCKET).upload(filename, new Uint8Array(buf), {
          contentType: 'video/mp4',
          upsert: true,
        });
        if (error) throw new Error(error.message);
        results.push(filename);
      } catch (e) {
        console.error('[funny-videos/cron] generation failed:', e);
      }
    }

    return NextResponse.json({ success: true, stored: results });
  } catch (error) {
    console.error('[funny-videos/cron] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


