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

    // Using the latest Ideogram v3 API format with multipart form
    console.log('[IDEOGRAM DEBUG] Using Ideogram v3 API with multipart/form-data');
    
    // Prepare form data for the request - works in both browser and Node.js
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('style_type', 'GENERAL'); // Valid options: AUTO, GENERAL, REALISTIC, DESIGN
    formData.append('rendering_speed', 'QUALITY');
    formData.append('resolution', '1344x768'); // Using valid resolution from API docs for 16:9 aspect ratio
    
    // Strong negative prompt to prevent text
    formData.append('negative_prompt', 
      "CRITICAL: NO TEXT OF ANY KIND. ABSOLUTELY FORBIDDEN: text, words, letters, numbers, writing, signage, captions, " +
      "subtitles, labels, logos, watermarks, symbols, characters, alphabets, numerals, digits, writing, visible language, " +
      "English, Thai, scripts, fonts, textual elements, hidden text, disguised text, text inside objects, text on signs, " +
      "letters inside images, numbers inside images, handwriting, calligraphy, typography, lettering, inscriptions, book pages, " +
      "displays, monitors showing text, interfaces with text, product labels, brand names, written instructions, titles, " +
      "headlines, quotes, speech bubbles, street signs, building signs, nameplates, posters with text, artwork with text, " +
      "clothing with text or numbers, text integrated into patterns, school blackboards with writing, license plates, calendars, " +
      "clocks with numbers, page numbers, price tags, receipts, handwritten notes, text overlays, banners with writing, diagrams " +
      "with labels, maps with place names, infographics with text, text in any form, text in any language, text in any style, " +
      "text in any size, text in any color, text in any position, text in any orientation, text in any context, text in any medium."
    );
    
    // Use the latest API version
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        // Content-Type is set automatically by FormData
      },
      body: formData,
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
    
    // Access URL via the updated data structure for v3 API
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