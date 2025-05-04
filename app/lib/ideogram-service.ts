// Service to interact with Ideogram API directly

import FormData from 'form-data';

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

    // Use multipart/form-data for v3 API
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('magic_prompt', 'OFF');
    formData.append('negative_prompt',
      `CRITICAL: Absolutely NO text, NO words, NO letters, NO numbers, NO writing, NO signage, NO captions, NO subtitles, NO labels, NO logos, NO watermarks, NO symbols, NO characters, NO alphabets, NO numerals, NO digits, NO writing of any kind, NO visible language, NO English, NO Thai, NO hidden text, NO hidden letters, NO hidden numbers, NO text in the background, NO text on objects, NO text anywhere in the image. If the topic itself is a word or phrase, do NOT render it as text—only as a visual concept. If numbers are part of the topic, they may only appear as objects, not as digits or text. NO text or writing on signs, banners, clothing, objects, or in the background.`
    );
    formData.append('rendering_speed', 'TURBO'); // Optional: keep fast
    formData.append('style_type', 'DESIGN'); // Keep your style
    formData.append('resolution', '1024x1024'); // Or your preferred resolution
    formData.append('num_images', '1');

    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        // 'Content-Type' will be set automatically by FormData
        ...formData.getHeaders?.(),
      },
      body: formData as unknown as BodyInit,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Ideogram API] Error: Status ${response.status}, Response: ${errorText}`);
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      const errorText = await response.text();
      console.error('[Ideogram API] Failed to parse JSON:', jsonErr, 'Raw response:', errorText);
      return null;
    }
    const imageUrl = data?.data?.[0]?.url;
    if (imageUrl) {
      console.log('[Ideogram API] Image generated successfully, URL:', imageUrl);
      return imageUrl;
    } else {
      console.error('[Ideogram API] No image URL found in response:', JSON.stringify(data));
      return null;
    }
  } catch (error) {
    console.error('Error calling Ideogram API:', error);
    return null;
  }
} 