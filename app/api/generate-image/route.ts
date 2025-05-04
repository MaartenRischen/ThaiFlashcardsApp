import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateImage } from '@/app/lib/ideogram-service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// Explicitly load dotenv in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('dotenv').config();
    console.log('[Image API] Loaded .env file in development mode');
  } catch (e) {
    console.warn('[Image API] Failed to load dotenv:', e);
  }
}

const imageRequestSchema = z.object({
  prompt: z.string().min(10).max(500),
  resolution: z.preprocess(
    (val) => Array.isArray(val) ? val[0] : val,
    z.string().optional()
  ),
});

export async function POST(req: NextRequest) {
  console.log("[Image API] Received request at /api/generate-image");
  
  // Check API key availability early
  const apiKey = process.env.IDEOGRAM_API_KEY;
  console.log(`[Image API] IDEOGRAM_API_KEY available: ${Boolean(apiKey)}`);
  console.log(`[Image API] IDEOGRAM_API_KEY first 10 chars: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);
  
  if (!apiKey) {
    console.error("[Image API] IDEOGRAM_API_KEY environment variable not set.");
    return NextResponse.json(
      { error: "API key not configured on server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    console.log("[Image API] Incoming request body:", body);
    
    const validation = imageRequestSchema.safeParse(body);
    if (!validation.success) {
      console.log("[Image API] Invalid request body:", validation.error.format());
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { prompt } = validation.data;
    console.log(`[Image API] Generating image for prompt: ${prompt}`);
    
    // Call the Ideogram API
    console.log('[Image API] Calling generateImage function...');
    const imageUrl = await generateImage(prompt);
    
    if (!imageUrl) {
      console.error('[Image API] Failed to generate image with Ideogram (null URL returned)');
      return NextResponse.json(
        { error: "Failed to generate image with Ideogram." },
        { status: 500 }
      );
    }
    
    console.log(`[Image API] Successfully generated image URL: ${imageUrl}`);
    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    console.error("[Image API] Error in /api/generate-image handler:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
