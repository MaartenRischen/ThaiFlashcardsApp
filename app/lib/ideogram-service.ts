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
    
    // Get rendering speed from localStorage if available, default to TURBO
    let renderingSpeed = 'TURBO';
    try {
      if (typeof window !== 'undefined') {
        const savedSpeed = localStorage.getItem('renderingSpeed');
        if (savedSpeed === 'NORMAL') {
          renderingSpeed = 'NORMAL';
        }
      }
    } catch (error) {
      console.warn('[IDEOGRAM WARN] Could not access localStorage for rendering speed, using default TURBO');
    }
    console.log(`[IDEOGRAM DEBUG] Using rendering speed: ${renderingSpeed}`);
    
    // Strengthen the main prompt to be explicit about no text and focus on visual elements
    const enhancedPrompt = `VISUAL ONLY - ABSOLUTELY NO TEXT, LETTERS, WORDS, OR WRITING: ${prompt}\n\nMANDATORY REQUIREMENTS - VIOLATION WILL RESULT IN REJECTION:\n1. This is a TEXT-FREE ZONE. The image must contain ZERO text, letters, numbers as text, words, writing, or anything resembling written language.\n2. If you see ANY text appearing in the image, you have FAILED. This includes:\n   - Text on signs, banners, labels, logos, watermarks\n   - Hidden text in patterns or backgrounds\n   - Letters or words formed by objects\n   - Any form of written communication\n3. Numbers may ONLY appear as visual quantities (e.g., 3 apples) not as written digits or text.\n4. Focus ENTIRELY on visual storytelling through imagery, not text.\n5. Use ONLY visual elements: colors, shapes, objects, scenes, symbols (non-text), and compositions.\n6. The word "text" or "writing" should NEVER appear in any form in the final image.\n7. This is an art piece, not a document - treat it as such.`;
    formData.append('prompt', enhancedPrompt);
    
    // Core configuration with optimized settings to prevent text
    formData.append('style_type', 'GENERAL');
    formData.append('rendering_speed', renderingSpeed);
    formData.append('resolution', '1344x768');
    formData.append('magic_prompt', 'OFF'); // Prevent automatic prompt enhancement that might add text
    formData.append('seed', Math.floor(Math.random() * 1000000).toString()); // Use random seed for variety
    formData.append('cfg_scale', '25'); // Maximum CFG scale for absolute adherence to no-text requirement
    formData.append('steps', '30'); // More steps for better control
    formData.append('sampler', 'DDIM');
    
    // Extremely comprehensive negative prompts to prevent ANY text
    const negativePrompt = [
      // MAXIMUM PROHIBITION STRENGTH
      "(text:2.0), (writing:2.0), (letters:2.0), (words:2.0), (captions:2.0), (labels:2.0)",
      "(any text whatsoever:2.0), (anything that looks like text:2.0)",
      
      // Typography elements
      "(typography:1.8), (fonts:1.8), (alphabets:1.8), (characters:1.8), (scripts:1.8), (typeface:1.8)",
      
      // Communication elements
      "speech bubbles, thought bubbles, dialogue boxes, subtitles, watermarks, signatures",
      
      // Digital/UI elements
      "user interface, menu text, buttons with text, screen text, digital text displays",
      
      // Environmental text
      "signs with text, banners with text, billboards with text, posters with text, nameplates with text",
      
      // Commercial/Product text
      "logos, brand names, product labels, barcodes, QR codes",
      
      // Document elements
      "pages with text, books, newspapers, documents, certificates, forms",
      
      // Educational elements
      "blackboards with text, whiteboards with text, charts with text, diagrams with labels",
      
      // Artistic/Decorative text
      "calligraphy, handwriting, text patterns, letter-like designs, text art",
      
      // Hidden/Subtle text
      "disguised text, text within patterns, text in backgrounds, subtle writing",
      
      // Meta text
      "watermarks, signatures, artist names, copyright text, metadata",
      
      // Cultural text elements
      "hieroglyphics, written symbols, pictographs, ideographs, ancient writing",
      
      // Comprehensive text exclusions
      "(any form of visible language or writing:2.0), (anything that could be interpreted as text:2.0)",
      "(text elements:2.0), (written content:2.0), (readable text:2.0), (text anywhere:2.0)"
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