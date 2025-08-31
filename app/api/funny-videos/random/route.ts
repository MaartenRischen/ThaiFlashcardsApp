import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

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
    } catch (e) {
      // Ignore storage errors, fall back to static asset
      console.warn('[funny-videos/random] Supabase storage unavailable:', e);
    }

    // Fallback: local bundled video(s)
    const fallbackVideos = [
      '/images/gifs/setwizardgif2.mp4',
    ];
    const choice = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
    return NextResponse.json({ url: choice, source: 'fallback' });
  } catch (error) {
    console.error('[funny-videos/random] Error:', error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}


