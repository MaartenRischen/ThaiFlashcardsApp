// Service to interact with our backend API for image generation

/**
 * Calls the backend API route to generate an image using Ideogram.
 * 
 * @param prompt The text prompt for image generation.
 * @returns The URL of the generated image, or null if an error occurred.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  console.log(`generateImage service called with prompt: ${prompt.substring(0,50)}...`);
  try {
    // FIX: Construct absolute URL using environment variable
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Fallback for safety
    const apiUrl = `${baseUrl}/api/generate-image`;
    console.log(`Calling image generation API at: ${apiUrl}`); // Log the constructed URL

    const response = await fetch(apiUrl, { // Use the absolute URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        resolution: '1024x512', // 2:1 aspect ratio
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error from /api/generate-image:', error);
      return null;
    }

    const data = await response.json();
    console.log("Image generated successfully, URL:", data.imageUrl);
    return data.imageUrl || null;

  } catch (error) {
    console.error('Error calling image generation service:', error);
    return null;
  }
} 