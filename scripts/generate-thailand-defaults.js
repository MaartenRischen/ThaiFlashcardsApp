const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.IDEOGRAM_API_KEY; // Set this in your .env or shell
const IDEOGRAM_API_URL = 'https://api.ideogram.ai/generate';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const prompts = months.map((month) =>
  `A happy donkey standing on a bridge in Thailand, with a ${month.toLowerCase()} seasonal atmosphere. The scene should reflect the typical weather, colors, and mood of ${month} in Thailand. Style: playful, colorful, mascot-like, landscape, 16:9 aspect ratio.`
);

async function generateImage(prompt, monthIdx) {
  const payload = {
    image_request: {
      prompt,
      aspect_ratio: 'ASPECT_16_9',
      model: 'V_2_TURBO',
      magic_prompt_option: 'AUTO'
    }
  };

  const res = await fetch(IDEOGRAM_API_URL, {
    method: 'POST',
    headers: {
      'Api-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`Failed to generate image for month ${monthIdx + 1}: ${await res.text()}`);
  }

  const data = await res.json();
  const imageUrl = data?.data?.[0]?.url;
  if (!imageUrl) throw new Error(`No image URL returned for month ${monthIdx + 1}`);

  // Download the image
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Failed to download image for month ${monthIdx + 1}`);

  const destPath = path.join(__dirname, '..', 'public', 'images', 'defaults', `default-thailand-${String(monthIdx + 1).padStart(2, '0')}.png`);
  const fileStream = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    imgRes.body.pipe(fileStream);
    imgRes.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`Saved: ${destPath}`);
}

(async () => {
  for (let i = 0; i < 12; i++) {
    try {
      await generateImage(prompts[i], i);
    } catch (err) {
      console.error(err);
    }
  }
})(); 