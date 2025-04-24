const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

interface IdeogramResponse {
  images: Array<{
    url: string;
    id: string;
  }>;
}

async function testIdeogramApi() {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  if (!apiKey) {
    console.error("Missing IDEOGRAM_API_KEY env variable");
    process.exit(1);
  }

  const prompt = "Cartoon style illustration featuring a friendly donkey and a bridge, with Thai visual elements and vibrant colors";
  
  try {
    console.log("Testing Ideogram API...");
    console.log("Prompt:", prompt);
    
    const response = await fetch("https://api.ideogram.ai/api/v1/images", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        style: "photograph",
        aspect_ratio: "16:9",
        model: "image-gen-v2",
        num_images: 1,
        width: 1920,
        height: 1080
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ideogram API Error: Status ${response.status}, Body: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json() as IdeogramResponse;
    console.log("Response:", JSON.stringify(data, null, 2));
    
    const imageUrl = data.images[0]?.url;
    if (imageUrl) {
      console.log("Success! Image URL:", imageUrl);
    } else {
      console.error("No image URL in response");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testIdeogramApi(); 