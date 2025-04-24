// Service to interact with Ideogram API directly

/**
 * Calls the Ideogram API to generate an image.
 * 
 * @param prompt The text prompt for image generation.
 * @returns The URL of the generated image, or null if an error occurred.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  console.log(`generateImage service called with prompt: ${prompt.substring(0,50)}...`);
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY;
    if (!apiKey) {
      console.error('IDEOGRAM_API_KEY not found in environment variables');
      return null;
    }

    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_request: {
          prompt,
          style_type: "DESIGN",
          resolution: "RESOLUTION_1024_1024",
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ideogram API Error: Status ${response.status}, Response: ${errorText}`);
      return null;
    }

    const data = await response.json();
    const imageUrl = data?.data?.[0]?.url;
    
    if (imageUrl) {
      console.log("Image generated successfully, URL:", imageUrl);
      return imageUrl;
    } else {
      console.error('No image URL found in Ideogram response:', data);
      return null;
    }
  } catch (error) {
    console.error('Error calling Ideogram API:', error);
    return null;
  }
} 