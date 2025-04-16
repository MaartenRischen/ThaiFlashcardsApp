import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define the expected request body schema
const imageRequestSchema = z.object({
  prompt: z.string().min(10).max(500), // Basic prompt validation
  resolution: z.preprocess(
    (val) => Array.isArray(val) ? val[0] : val,
    z.string().optional()
  ),
});

// Placeholder for actual Ideogram API call structure
// NOTE: Ideogram API likely involves asynchronous job submission and polling.
// This is a simplified placeholder assuming a direct response or short wait.
async function callIdeogramApi(prompt: string, apiKey: string): Promise<string | null> {
  console.log(`Calling Ideogram API (V_3) with prompt: ${prompt.substring(0, 50)}...`);
  const IDEOGRAM_API_URL = "https://api.ideogram.ai/generate";

  try {
    // Use the correct payload as required by the Ideogram API
    const payload = {
      image_request: {
        prompt,
        aspect_ratio: "ASPECT_2_1",
        model: "V_3",
        magic_prompt_option: "AUTO"
      }
    };
    console.log('Outgoing payload to Ideogram V_3:', payload);

    const response = await fetch(IDEOGRAM_API_URL, {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ideogram API Error (${response.status}): ${errorBody}`);
      throw new Error(`Ideogram API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    console.log("Ideogram API Response:", result);

    // Extract the image URL from the first item in the data array
    const imageUrl = result?.data?.[0]?.url || null;

    if (!imageUrl) {
      console.error("Could not extract image URL from Ideogram response:", result);
      throw new Error("Failed to get image URL from Ideogram.");
    }

    return imageUrl;
  } catch (error) {
    console.error("Error calling Ideogram API:", error);
    throw error; // propagate error for detailed client message
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

    const { prompt } = validation.data;
    console.log(`Generating image for prompt: ${prompt}`);

    // Call the Ideogram API function
    const imageUrl = await callIdeogramApi(prompt, apiKey);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image." },
        { status: 500 }
      );
    }

    console.log(`Successfully generated image URL: ${imageUrl}`);
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error("Error in /api/generate-image handler:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong." },
      { status: 500 }
    );
  }
}
