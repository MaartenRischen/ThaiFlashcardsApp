import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Define the expected request body schema
const imageRequestSchema = z.object({
  prompt: z.string().min(10).max(500), // Basic prompt validation
});

// Placeholder for actual Ideogram API call structure
// NOTE: Ideogram API likely involves asynchronous job submission and polling.
// This is a simplified placeholder assuming a direct response or short wait.
async function callIdeogramApi(prompt: string, apiKey: string): Promise<string | null> {
  console.log(`Calling Ideogram API with prompt: ${prompt.substring(0, 50)}...`);
  const IDEOGRAM_API_URL = "https://api.ideogram.ai/v1/images/generations"; // Replace with actual endpoint if different

  try {
    // --- Simplified Request --- 
    // This payload is a GUESS based on common patterns. 
    // **You MUST consult the Ideogram API documentation for the correct payload structure.**
    const response = await fetch(IDEOGRAM_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        // Add other required parameters like aspect_ratio, style_preset etc.
        // e.g., aspect_ratio: "16:9", style_preset: "cinematic" 
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Ideogram API Error (${response.status}): ${errorBody}`);
      throw new Error(`Ideogram API request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log("Ideogram API Response:", result);

    // --- Extract Image URL --- 
    // This is also a GUESS. **Adjust based on the actual Ideogram API response structure.**
    // It might be nested, it might be in an array, it might be a job ID requiring polling.
    const imageUrl = result?.data?.[0]?.url || result?.url || null;
    
    if (!imageUrl) {
        console.error("Could not extract image URL from Ideogram response:", result);
        throw new Error("Failed to get image URL from Ideogram.");
    }

    return imageUrl;
    
  } catch (error) {
    console.error("Error calling Ideogram API:", error);
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

    // Call the (simplified) Ideogram API function
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
