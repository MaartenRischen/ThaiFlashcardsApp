require('dotenv').config();

const testIdeogramApi = async () => {
  try {
    // Try to load from .env file if in development, but don't fail if file doesn't exist
    try {
      require('dotenv').config();
    } catch (e) {
      // Silently continue if .env file is not found
    }

    const apiKey = process.env.IDEOGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('IDEOGRAM_API_KEY not found in environment variables');
    }

    const prompt = "A cartoon-style illustration featuring a friendly donkey and a bridge with Thai visual elements and vibrant colors. NO TEXT ALLOWED.";
    
    // Create a FormData object for the multipart request
    const { FormData } = await import('formdata-node');
    const formData = new FormData();
    
    // Add required parameters
    formData.append('prompt', prompt);
    formData.append('style_type', 'GENERAL');
    formData.append('rendering_speed', 'TURBO');
    formData.append('negative_prompt', 
      "CRITICAL: NO TEXT OF ANY KIND. ABSOLUTELY FORBIDDEN: text, words, letters, numbers, writing, signage, captions, " +
      "subtitles, labels, logos, watermarks, symbols, characters, alphabets, numerals, digits, writing, visible language, " +
      "English, Thai, scripts, fonts, textual elements, hidden text, disguised text, text inside objects, text on signs, " +
      "letters inside images, numbers inside images, handwriting, calligraphy, typography, lettering, inscriptions, book pages, " +
      "displays, monitors showing text, interfaces with text, product labels, brand names, written instructions, titles, " +
      "headlines, quotes, speech bubbles, street signs, building signs, nameplates, posters with text, artwork with text."
    );
    
    // Use the v3 API endpoint
    const response = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        // Content-Type is set automatically by FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data.data && data.data[0] && data.data[0].url) {
      console.log('Generated image URL:', data.data[0].url);
    } else {
      console.log('No image URL in response');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Import fetch dynamically since we're using CommonJS
import('node-fetch').then(({default: fetch}) => {
  testIdeogramApi();
}).catch(err => {
  console.error('Error importing node-fetch:', err);
}); 