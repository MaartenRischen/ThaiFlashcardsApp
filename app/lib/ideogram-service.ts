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
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error from /api/generate-image (${response.status}):`, errorData.error);
      throw new Error(errorData.error || 'Failed to generate image via backend');
    }

    const data = await response.json();
    console.log("Image generated successfully, URL:", data.imageUrl);
    return data.imageUrl;

  } catch (error) {
    console.error('Error calling image generation service:', error);
    return null;
  }
} 