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
    const enhancedPrompt = `VISUAL ONLY - NO TEXT ALLOWED: ${prompt}\n\nCRITICAL REQUIREMENTS FOR IMAGE GENERATION:\n1. Create a purely visual representation with absolutely NO text, letters, or writing of any kind.\n2. Focus on visual storytelling through images, colors, and scenes only.\n3. Use symbolic and pictorial elements to convey meaning.\n4. Avoid anything that could be interpreted as text or writing.\n5. Create clean, text-free compositions that tell the story through imagery alone.`;
    formData.append('prompt', enhancedPrompt);
    
    // Core configuration with optimized settings to prevent text
    formData.append('style_type', 'GENERAL');
    formData.append('rendering_speed', renderingSpeed);
    formData.append('resolution', '1344x768');
    formData.append('magic_prompt', 'OFF'); // Prevent automatic prompt enhancement that might add text
    formData.append('seed', Math.floor(Math.random() * 1000000).toString()); // Use random seed for variety
    formData.append('cfg_scale', '20'); // Higher CFG scale for stronger adherence to prompt requirements
    formData.append('steps', '30'); // More steps for better control
    formData.append('sampler', 'DDIM');
    
    // Updated negative prompts to allow numbers while maintaining strict text prevention
    const negativePrompt = [
      // ABSOLUTE PROHIBITIONS (core text elements)
      "(text:1.5), (writing:1.5), (letters:1.5), (words:1.5), (captions:1.5), (labels:1.5)",
      
      // Typography elements
      "(typography:1.4), (fonts:1.4), (alphabets:1.4), (characters:1.4), (scripts:1.4)",
      
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
      "(any form of visible language or writing:1.6), (anything that could be interpreted as text:1.6)"
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