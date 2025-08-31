import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';
import { generateComicStrip } from '@/app/lib/comic-generator';

const BUCKET = process.env.FUNNY_COMICS_BUCKET || 'funny-comics';
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

    const numComics = 2; // generate a couple per run
    const results: string[] = [];

    for (let i = 0; i < numComics; i++) {
      try {
        const comic = await generateComicStrip();
        
        // Create directory for this comic
        const comicDir = comic.id;
        
        // Upload each panel
        for (let j = 0; j < comic.panels.length; j++) {
          const panel = comic.panels[j];
          if (!panel.imageUrl) continue;
          
          // Fetch panel image
          const resp = await fetch(panel.imageUrl);
          if (!resp.ok) continue;
          
          const buf = await resp.arrayBuffer();
          const panelName = `panel-${(j + 1).toString().padStart(2, '0')}.png`;
          const path = `${comicDir}/${panelName}`;
          
          const { error } = await supabase.storage.from(BUCKET).upload(path, new Uint8Array(buf), {
            contentType: 'image/png',
            upsert: true,
          });
          
          if (error) {
            console.error(`[funny-comics/cron] Failed to upload panel ${j}:`, error);
          }
        }
        
        results.push(comicDir);
      } catch (e) {
        console.error('[funny-comics/cron] generation failed:', e);
      }
    }

    return NextResponse.json({ success: true, stored: results });
  } catch (error) {
    console.error('[funny-videos/cron] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


