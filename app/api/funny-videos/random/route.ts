import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

const BUCKET = process.env.FUNNY_COMICS_BUCKET || 'funny-comics';
const CRON_KEY = process.env.CRON_SECRET_KEY || 'dbw-cron-2L9hJk7uYqN5sT3aX8wZ4mC1rV6pB2n';

export async function GET(req: NextRequest) {
  try {
    console.log('[funny-videos/random] Starting comic fetch');
    // Try Supabase bucket first
    try {
      const supabase = getSupabaseAdmin();
      console.log('[funny-videos/random] Got Supabase admin client');
      // Ensure bucket exists (best-effort)
      await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {
        console.log('[funny-videos/random] Bucket likely already exists');
      });

      const { data: files, error } = await supabase.storage.from(BUCKET).list('', { limit: 100 });
      console.log('[funny-videos/random] List result:', { filesCount: files?.length || 0, error });
      
      if (!error && files && files.length > 0) {
        const publicBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;
        const comicDirs = files.filter(f => f.name && !f.name.includes('.')); // directories only
        console.log('[funny-videos/random] Found comic directories:', comicDirs.length);
        
        if (comicDirs.length > 0) {
          const choice = comicDirs[Math.floor(Math.random() * comicDirs.length)];
          // Get panel images from the chosen comic directory
          const { data: panels } = await supabase.storage.from(BUCKET).list(choice.name, { limit: 10 });
          if (panels && panels.length > 0) {
            const panelUrls = panels
              .filter(p => p.name.match(/\.(jpg|jpeg|png|webp)$/i))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => `${publicBase}/${encodeURIComponent(choice.name)}/${encodeURIComponent(p.name)}`);
            return NextResponse.json({ 
              type: 'comic',
              panels: panelUrls,
              title: choice.name.replace(/-/g, ' '),
              source: 'supabase' 
            });
          }
        }
      }

      // If empty: trigger cron generator in a separate request (fire-and-forget)
      console.log('[funny-videos/random] No comics found, triggering generation');
      try {
        const origin = req.nextUrl.origin;
        console.log('[funny-videos/random] Triggering cron at:', `${origin}/api/funny-videos/cron`);
        // don't await; let it run separately
        fetch(`${origin}/api/funny-videos/cron`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${CRON_KEY}` },
        }).catch((e) => {
          console.error('[funny-videos/random] Failed to trigger cron:', e);
        });
      } catch (e) {
        console.error('[funny-videos/random] Error triggering cron:', e);
      }
    } catch (e) {
      // Ignore storage errors, fall back to static asset
      console.warn('[funny-videos/random] Supabase storage unavailable:', e);
    }

    // No comic available yet: return null while generation runs
    return NextResponse.json({ type: 'comic', panels: [], title: 'Loading...', source: 'none' });
  } catch (error) {
    console.error('[funny-videos/random] Error:', error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}


