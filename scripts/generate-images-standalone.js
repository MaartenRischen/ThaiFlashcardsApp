#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Load environment variables
require('dotenv').config();

const DEFAULT_SETS = [
  { id: 'numbers-1-10', name: 'Numbers 1-10' },
  { id: 'basic-colors', name: 'Basic Colors' },
  { id: 'days-of-week', name: 'Days of the Week' },
  { id: 'family-members', name: 'Family Members' },
  { id: 'months-of-year', name: 'Months of the Year' },
  { id: 'body-parts', name: 'Body Parts' },
  { id: 'weather-terms', name: 'Weather & Climate' },
  { id: 'time-expressions', name: 'Time Expressions' },
  { id: 'formal-business', name: 'Formal Business Thai' },
  { id: 'thai-proverbs', name: 'Thai Proverbs & Idioms' }
];

const IMAGE_PROMPTS = {
  'numbers-1-10': "Create a cute, educational illustration showing Thai numbers 1 through 10 in a playful, colorful style. Include visual representations like counting on fingers, dice, or objects arranged in groups. Use bright, child-friendly colors. Make it look like a fun educational poster. NO TEXT, NO WRITTEN NUMBERS, NO DIGITS.",
  
  'basic-colors': "Create a vibrant illustration showing a rainbow and various colorful objects representing basic colors. Include red apples, blue sky, green leaves, yellow sun, black cat, and white clouds. Make it visually appealing and educational. NO TEXT OR LABELS.",
  
  'days-of-week': "Create an illustration showing the concept of a week using a circular calendar design with 7 distinct sections, each with different activities or symbols representing daily routines. Use varied colors for each day. Make it look like a weekly planner visualization. NO TEXT OR DAY NAMES.",
  
  'family-members': "Create a warm, friendly illustration of a Thai family gathering with multiple generations - grandparents, parents, and children. Show them in traditional Thai clothing having a meal together. Make it heartwarming and culturally authentic. NO TEXT OR LABELS.",
  
  'months-of-year': "Create a beautiful illustration showing the cycle of seasons and months in Thailand, with visual representations of weather changes, festivals, and seasonal activities throughout the year. Include elements like rain, sun, flowers blooming. NO TEXT OR MONTH NAMES.",
  
  'body-parts': "Create an educational illustration showing a friendly cartoon character (not too anatomical) with visual indicators pointing to different body parts. Make it child-friendly and educational, like a fun anatomy poster. NO TEXT OR LABELS.",
  
  'weather-terms': "Create a dynamic illustration showing various weather conditions in Thailand - sunny skies, rain, thunderstorms, and cloudy weather. Show the transitions between different weather patterns in an artistic way. NO TEXT OR WEATHER LABELS.",
  
  'time-expressions': "Create an artistic illustration showing the passage of time through a day - sunrise, morning activities, afternoon, evening, and night. Include clocks showing different times and people doing time-specific activities. NO TEXT OR TIME LABELS.",
  
  'formal-business': "Create a professional illustration showing Thai business people in formal attire having a meeting in a modern office setting. Include elements like presentations, handshakes, and professional interactions. Make it look sophisticated and corporate. NO TEXT OR SIGNAGE.",
  
  'thai-proverbs': "Create an artistic, traditional Thai-style illustration with mystical elements, showing wise animals (elephants, tigers) and traditional Thai art motifs. Make it look like ancient wisdom being passed down through generations. NO TEXT OR PROVERBS."
};

async function generateImage(prompt) {
  const apiKey = process.env.IDEOGRAM_API_KEY;
  
  if (!apiKey) {
    throw new Error('IDEOGRAM_API_KEY not found in environment variables');
  }

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('style', 'illustration');
  formData.append('aspect_ratio', '16x9');
  formData.append('quantity', '1');
  formData.append('quality', 'high');
  formData.append('generation_type', 'TURBO');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.ideogram.ai',
      path: '/v1/ideogram-v3/generate',
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        ...formData.getHeaders()
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log(`  Response status: ${res.statusCode}`);
          if (res.statusCode !== 200) {
            console.log(`  Response body: ${data}`);
          }
          const result = JSON.parse(data);
          const imageUrl = result?.data?.[0]?.url;
          if (imageUrl) {
            resolve(imageUrl);
          } else {
            reject(new Error('No image URL in response: ' + data));
          }
        } catch (error) {
          reject(new Error('Failed to parse response: ' + error.message));
        }
      });
    });
    
    req.on('error', reject);
    formData.pipe(req);
  });
}

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Starting to generate images for default sets...');
  console.log('API Key available:', !!process.env.IDEOGRAM_API_KEY);
  
  // Create directory if it doesn't exist
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'defaults');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created directory:', imagesDir);
  }
  
  for (let i = 0; i < DEFAULT_SETS.length; i++) {
    const set = DEFAULT_SETS[i];
    const prompt = IMAGE_PROMPTS[set.id];
    
    console.log(`\n[${i + 1}/${DEFAULT_SETS.length}] Generating image for: ${set.name}`);
    
    try {
      const imageUrl = await generateImage(prompt);
      
      // Download the image
      const filename = `default-thailand-${(i + 1).toString().padStart(2, '0')}.png`;
      const filepath = path.join(imagesDir, filename);
      
      console.log(`  Downloading image...`);
      await downloadImage(imageUrl, filepath);
      
      console.log(`  ✓ Success! Saved as: ${filename}`);
      
      // Wait before next request
      if (i < DEFAULT_SETS.length - 1) {
        console.log(`  Waiting 3 seconds before next request...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Image generation complete!');
}

main().catch(console.error); 