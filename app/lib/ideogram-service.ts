// Service to interact with Ideogram API directly

/**
 * Calls the Ideogram API to generate an image.
 * 
 * @param prompt The text prompt for image generation.
 * @returns The URL of the generated image, or null if an error occurred.
 */
export async function generateImage(prompt: string): Promise<string | null> {
  console.log(`[IDEOGRAM DEBUG] generateImage service called with prompt: ${prompt.substring(0,50)}...`);
  console.log(`[IDEOGRAM DEBUG] Full prompt length: ${prompt.length} characters`);
  try {
    const apiKey = process.env.IDEOGRAM_API_KEY;
    console.log(`[IDEOGRAM DEBUG] API Key present: ${Boolean(apiKey)}`);
    console.log(`[IDEOGRAM DEBUG] API Key first 10 chars: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);
    
    if (!apiKey) {
      console.error('[IDEOGRAM ERROR] IDEOGRAM_API_KEY not found in environment variables');
      return null;
    }

    // Using the JSON API format instead of FormData (based on the test script)
    console.log('[IDEOGRAM DEBUG] Using JSON API format for Ideogram');
    
    const requestBody = {
      image_request: {
        prompt: prompt,
        style_type: "DESIGN",
        resolution: "RESOLUTION_1312_736",
        negative_prompt: "CRITICAL: Absolutely NO text, NO words, NO letters, NO numbers, NO writing, NO signage, NO captions, NO subtitles, NO labels, NO logos, NO watermarks, NO symbols, NO characters, NO alphabets, NO numerals, NO digits, NO writing of any kind, NO visible language, NO English, NO Thai, NO hidden text, NO hidden letters, NO hidden numbers, NO text in the background, NO text on objects, NO text anywhere in the image.",
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    console.log('[IDEOGRAM DEBUG] Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');
    
    const response = await fetch('https://api.ideogram.ai/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[IDEOGRAM DEBUG] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[IDEOGRAM ERROR] API Error: Status ${response.status}, Response: ${errorText}`);
      return null;
    }

    let data;
    try {
      data = await response.json();
      console.log('[IDEOGRAM DEBUG] Response parsed successfully:', JSON.stringify(data).substring(0, 200) + '...');
    } catch (jsonErr) {
      const errorText = await response.text();
      console.error('[IDEOGRAM ERROR] Failed to parse JSON:', jsonErr, 'Raw response:', errorText);
      return null;
    }
    
    const imageUrl = data?.data?.[0]?.url;
    if (imageUrl) {
      console.log('[IDEOGRAM SUCCESS] Image generated successfully, URL:', imageUrl);
      return imageUrl;
    } else {
      console.error('[IDEOGRAM ERROR] No image URL found in response:', JSON.stringify(data));
      return null;
    }
  } catch (error) {
    console.error('[IDEOGRAM ERROR] Error calling Ideogram API:', error);
    return null;
  }
} 