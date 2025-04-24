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

    const prompt = "A cartoon-style illustration featuring a friendly donkey and a bridge with Thai visual elements and vibrant colors";
    
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