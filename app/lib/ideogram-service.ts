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
    const apiUrl = `${baseUrl}/api/generate-image/`; // Add trailing slash to avoid redirect
    console.log(`Calling image generation API at: ${apiUrl}`); // Log the constructed URL

    const response = await fetch(apiUrl, { // Use the absolute URL
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        resolution: 'landscape', // Use landscape aspect ratio for better visualization
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from /api/generate-image: Status ${response.status}, Response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    if (!data.imageUrl) {
      console.error('Image generation API returned no image URL:', data);
      return null;
    }
    
    console.log("Image generated successfully, URL:", data.imageUrl);
    return data.imageUrl;

  } catch (error) {
    console.error('Error calling image generation service:', error);
    return null;
  }
} 