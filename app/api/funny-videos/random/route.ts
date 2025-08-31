import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { funnyPromptVariants, generateDonkeyBridgeVideo } from '@/app/lib/openrouter-video';

const BUCKET = process.env.FUNNY_VIDEOS_BUCKET || 'funny-videos';

export async function GET() {
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

      // If empty: auto-seed in background with 10 funny videos via OpenRouter
      (async () => {
        try {
          const variants = funnyPromptVariants(10);
          for (const v of variants) {
            try {
              const { url } = await generateDonkeyBridgeVideo(v);
              const resp = await fetch(url);
              if (!resp.ok) continue;
              const buf = await resp.arrayBuffer();
              const filename = `seed-${Date.now()}-${Math.random().toString(36).slice(2,8)}.mp4`;
              await supabase.storage.from(BUCKET).upload(filename, new Uint8Array(buf), {
                contentType: 'video/mp4', upsert: true,
              });
            } catch (e) {
              console.error('[funny-videos/random] seed item failed:', e);
            }
          }
          console.log('[funny-videos/random] seeding complete');
        } catch (e) {
          console.error('[funny-videos/random] seeding error:', e);
        }
      })();
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


