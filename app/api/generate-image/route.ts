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

// List of models in fallback order
const IMAGE_MODELS = [
  'google/gemini-2.5-pro', // Gemini 2.5 Pro (if available for images)
  'openai/dall-e-3',       // OpenAI DALL·E 3
  'openai/dall-e-2',       // OpenAI DALL·E 2
  'anthropic/claude-3-opus', // Anthropic (if image capable)
  'stability-ai/stable-diffusion-v1-5', // Stable Diffusion
  'mistralai/mixtral-8x7b', // Other fallback
];

async function callOpenRouterImageApi(prompt: string, resolution: string | undefined, models: string[]): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY env variable");

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: resolution || "1024x1024"
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter Image API Error (model: ${model}): Status ${response.status}, Body: ${errorText}`);
        continue;
      }
      const data = await response.json();
      // Try to extract the image URL from the response
      const imageUrl = data?.data?.[0]?.url || data?.images?.[0]?.url || null;
      if (imageUrl) {
        console.log(`Image generated successfully with model ${model}: ${imageUrl}`);
        return imageUrl;
      } else {
        console.error(`No image URL found in OpenRouter response for model ${model}:`, data);
      }
    } catch (error) {
      console.error(`Error calling OpenRouter image model ${model}:`, error);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log("Received request at /api/generate-image");
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY environment variable not set.");
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
    // Call the OpenRouter Image API with fallback logic
    const imageUrl = await callOpenRouterImageApi(prompt, resolution, IMAGE_MODELS);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image with any available model." },
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
