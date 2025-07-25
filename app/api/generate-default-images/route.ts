import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ideogram-service';
import { DEFAULT_SETS } from '@/app/data/default-sets';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';

// Image prompts for each default set
const IMAGE_PROMPTS: Record<string, string> = {
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

async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks: Buffer[] = [];
      
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      response.on('error', reject);
    });
  });
}

export async function GET() {
  console.log('Starting to generate images for default sets...');
  
  const results = [];
  
  for (let i = 0; i < DEFAULT_SETS.length; i++) {
    const set = DEFAULT_SETS[i];
    const prompt = IMAGE_PROMPTS[set.id];
    
    if (!prompt) {
      results.push({
        set: set.name,
        success: false,
        error: 'No prompt found'
      });
      continue;
    }
    
    console.log(`Generating image for: ${set.name}`);
    
    try {
      const imageUrl = await generateImage(prompt);
      
      if (imageUrl) {
        // Download and save the image
        const filename = `default-thailand-${(i + 1).toString().padStart(2, '0')}.png`;
        const dirPath = path.join(process.cwd(), 'public', 'images', 'defaults');
        const filepath = path.join(dirPath, filename);
        
        // Create directory if it doesn't exist
        await fs.mkdir(dirPath, { recursive: true });
        
        // Download the image
        const imageBuffer = await downloadImage(imageUrl);
        await fs.writeFile(filepath, imageBuffer);
        
        results.push({
          set: set.name,
          success: true,
          filename,
          originalUrl: imageUrl
        });
        
        console.log(`✓ Successfully generated image for: ${set.name}`);
      } else {
        results.push({
          set: set.name,
          success: false,
          error: 'Failed to generate image'
        });
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      results.push({
        set: set.name,
        success: false,
        error: String(error)
      });
      console.error(`Error generating image for ${set.name}:`, error);
    }
  }
  
  return NextResponse.json({
    message: 'Image generation complete',
    results
  });
} 