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
    
    // Strengthen the main prompt to be explicit about no text
    const enhancedPrompt = `${prompt}\n\nCRITICAL REQUIREMENTS:\n1. This image MUST NOT contain ANY text, letters, numbers, or writing of ANY kind.\n2. If the topic contains words, represent them ONLY through visual elements.\n3. NO text-like patterns or shapes that could be interpreted as writing.\n4. NO signs, labels, logos, or any form of written communication.`;
    formData.append('prompt', enhancedPrompt);
    
    // Core configuration
    formData.append('style_type', 'GENERAL');
    formData.append('rendering_speed', 'TURBO');
    formData.append('resolution', '1344x768');
    formData.append('magic_prompt', 'OFF'); // Prevent automatic prompt enhancement that might add text
    formData.append('seed', '31415927'); // Use a consistent seed we know works well
    
    // Expanded negative prompt with more specific patterns to exclude
    const negativePrompt = [
      // Core text prohibitions
      "CRITICAL: NO TEXT OF ANY KIND. ABSOLUTELY FORBIDDEN: text, words, letters, numbers, writing, signage, captions, subtitles, labels, logos, watermarks",
      
      // Specific text types
      "symbols, characters, alphabets, numerals, digits, writing, visible language, English, Thai, scripts, fonts, textual elements",
      
      // Hidden or subtle text
      "hidden text, disguised text, text inside objects, text on signs, letters inside images, numbers inside images",
      
      // Writing forms
      "handwriting, calligraphy, typography, lettering, inscriptions, book pages",
      
      // Digital/screen text
      "displays showing text, monitors with text, interfaces with text, screens with writing, digital displays with numbers",
      
      // Product/commercial text
      "product labels, brand names, written instructions, titles, headlines, price tags, barcodes, QR codes",
      
      // Communication elements
      "quotes, speech bubbles, thought bubbles, dialogue boxes, comic text, subtitles, captions",
      
      // Environmental text
      "street signs, building signs, nameplates, posters with text, billboards, banners with text",
      
      // Decorative/integrated text
      "text integrated into patterns, text as texture, text as design elements, text-like shapes, letter-like forms",
      
      // Educational/information text
      "school blackboards with writing, whiteboards with text, information panels, instructional text",
      
      // Time/date elements
      "calendars with numbers, clocks with numbers, dates, timestamps, numerical indicators",
      
      // Document elements
      "page numbers, receipts, tickets, forms, certificates, documents of any kind",
      
      // Comprehensive catch-all
      "text in any form, text in any language, text in any style, text in any size, text in any color, text in any position, text in any orientation, text in any context, text in any medium, anything that could be interpreted as text or writing"
    ].join(", ");
    
    formData.append('negative_prompt', negativePrompt);
    
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