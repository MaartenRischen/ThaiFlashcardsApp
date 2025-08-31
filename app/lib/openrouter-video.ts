/*
  Utilities to generate short funny donkey-on-a-bridge videos via OpenRouter.

  Notes:
  - Default model can be overridden via env OPENROUTER_VIDEO_MODEL.
  - Tested models: luma/dream-machine (text-to-video). If Gemini video becomes
    available via OpenRouter, set OPENROUTER_VIDEO_MODEL accordingly.
*/

export interface GeneratedVideo {
  url: string; // Temporary URL returned by provider or OpenRouter
}

const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_VIDEO_MODEL = process.env.OPENROUTER_VIDEO_MODEL || 'luma/dream-machine';

function getHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'X-Title': 'Thai Flashcards App',
    'HTTP-Referer': 'https://donkeybridge.world',
  };
}

export async function generateDonkeyBridgeVideo(promptVariant: string): Promise<GeneratedVideo> {
  const headers = getHeaders();

  // Unified responses API supports multi-modal outputs
  const resp = await fetch(`${OPENROUTER_BASE}/responses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OPENROUTER_VIDEO_MODEL,
      // Prompt guides: 8 seconds, funny, donkey + bridge, safe, colorful
      input: `Create an ~8 second funny, wholesome, cartoonish video about a donkey and a bridge. Make it delightful, playful, and meme-worthy, with clear visual storytelling. ${promptVariant}. Keep it safe and family-friendly.`,
      // Some providers support duration hints
      video: { duration: 8 },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenRouter video error ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  // Expected shapes differ by provider; attempt common patterns
  // 1) data.output may be an array of objects with { type: 'video', url }
  if (Array.isArray(data.output)) {
    type OutputItem = { type?: string; mime?: string; url?: string; content?: Array<{ url?: string }> };
    const vid: OutputItem | undefined = (data.output as OutputItem[]).find((o) => (
      (o.type === 'video' || (typeof o.mime === 'string' && o.mime.startsWith('video')))
      && (o.url || (Array.isArray(o.content) && o.content[0]?.url))
    ));
    const url = vid?.url || vid?.content?.[0]?.url;
    if (url) return { url };
  }
  // 2) data.data[0].url or data.video.url
  const fallbackUrl = data?.data?.[0]?.url || data?.video?.url || data?.output_url;
  if (fallbackUrl) return { url: fallbackUrl };

  throw new Error('OpenRouter response did not include a video URL');
}

export function funnyPromptVariants(count: number): string[] {
  const variants = [
    'The donkey confidently tries to cross a very wobbly rope bridge while a tiny bird acts like a traffic controller.',
    'A heroic donkey trains to cross a bridge like an action movie montage—wrong music cues and all.',
    'Two donkeys politely argue over who goes first on a narrow bridge, then a goat drives past on a scooter.',
    'A donkey thinks the drawbridge is an elevator and keeps pressing an imaginary button with dramatic patience.',
    'The donkey tiptoes across a bridge as if it were hot lava, then proudly celebrates at the end with confetti.',
    'A windy day: the donkey’s scarf flaps wildly as it moonwalks across the bridge to triumphant kazoos.',
    'The donkey pays a troll bridge toll… in carrots… then both cheer and dance.',
  ];
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(variants[Math.floor(Math.random() * variants.length)]);
  }
  return picks;
}


