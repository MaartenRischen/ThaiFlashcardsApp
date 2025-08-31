import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { funnyPromptVariants, generateDonkeyBridgeVideo } from '@/app/lib/openrouter-video';

const BUCKET = process.env.FUNNY_VIDEOS_BUCKET || 'funny-videos';
const CRON_KEY = process.env.CRON_SECRET_KEY || 'dbw-cron-2L9hJk7uYqN5sT3aX8wZ4mC1rV6pB2n';

export async function GET(req: NextRequest) {
  try {
    // Try Supabase bucket first
    try {
      const supabase = getSupabaseAdmin();
      // Ensure bucket exists (best-effort)
      await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

      const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
      if (!error && files && files.length > 0) {
        const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
        const mp4s = files
          .filter(f => f.name.toLowerCase().endsWith('.mp4'))
          .map(f => `${publicBase}/${encodeURIComponent(f.name)}`);
        if (mp4s.length > 0) {
          const choice = mp4s[Math.floor(Math.random() * mp4s.length)];
          return NextResponse.json({ url: choice, source: 'supabase' });
        }
      }

      // If empty: trigger cron generator in a separate request (fire-and-forget)
      try {
        const origin = req.nextUrl.origin;
        // don't await; let it run separately
        fetch(`${origin}/api/funny-videos/cron`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_KEY}` },
        }).catch(() => {});
      } catch (_) {}
    } catch (e) {
      // Ignore storage errors, fall back to static asset
      console.warn('[funny-videos/random] Supabase storage unavailable:', e);
    }

    // No video available yet
    return NextResponse.json({ url: null, source: 'none' });
  } catch (error) {
    console.error('[funny-videos/random] Error:', error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}


