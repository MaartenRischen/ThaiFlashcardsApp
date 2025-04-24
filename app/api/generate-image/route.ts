import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return 'Something went wrong.';
}

const imageRequestSchema = z.object({
  prompt: z.string().min(10).max(500),
  resolution: z.preprocess(
    (val) => Array.isArray(val) ? val[0] : val,
    z.string().optional()
  ),
});

async function callIdeogramApi(prompt: string, resolution: string | undefined): Promise<string | null> {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) throw new Error("Missing IDEOGRAM_API_KEY env variable");

  try {
    console.log(`Calling Ideogram API with prompt: ${prompt}`);
    const response = await fetch("https://api.ideogram.ai/generate", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image_request: {
          prompt: prompt,
          style_type: "DESIGN",
          resolution: "RESOLUTION_1312_736",
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ideogram API Error: Status ${response.status}, Body: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;
    
    if (imageUrl) {
      console.log(`Image generated successfully with Ideogram: ${imageUrl}`);
      return imageUrl;
    } else {
      console.error(`No image URL found in Ideogram response:`, data);
      return null;
    }
  } catch (error) {
    console.error(`Error calling Ideogram API:`, error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log("Received request at /api/generate-image");
  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) {
    console.error("IDEOGRAM_API_KEY environment variable not set.");
    return NextResponse.json(
      { error: "API key not configured on server." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    console.log("Incoming request body:", body);
    const validation = imageRequestSchema.safeParse(body);
    if (!validation.success) {
      console.log("Invalid request body:", validation.error.format());
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }
    const { prompt, resolution } = validation.data;
    console.log(`Generating image for prompt: ${prompt}`);
    
    // Call the Ideogram API
    const imageUrl = await callIdeogramApi(prompt, resolution);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image with Ideogram." },
        { status: 500 }
      );
    }
    console.log(`Successfully generated image URL: ${imageUrl}`);
    return NextResponse.json({ imageUrl });
  } catch (error: unknown) {
    console.error("Error in /api/generate-image handler:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
