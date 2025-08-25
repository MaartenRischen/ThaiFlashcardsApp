import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ideogram-service';
import { ALL_DEFAULT_SETS } from '@/app/data/default-sets';
import fs from 'fs/promises';
import path from 'path';
import https from 'https';

// Prevent static generation of this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Image prompts for each default set
const IMAGE_PROMPTS: Record<string, string> = {
  'numbers-1-10': "Create a cute, educational illustration showing Thai numbers 1 through 10 in a playful, colorful style. Include visual representations like counting on fingers, dice, or objects arranged in groups. Use bright, child-friendly colors. Make it look like a fun educational poster. NO TEXT, NO WRITTEN NUMBERS, NO DIGITS.",
  
  'basic-colors': "Create a vibrant illustration showing a rainbow and various colorful objects representing basic colors. Include red apples, blue sky, green leaves, yellow sun, black cat, and white clouds. Make it visually appealing and educational. NO TEXT OR LABELS.",
  
  'days-of-week': "Create an illustration showing the concept of a week using a circular calendar design with 7 distinct sections, each with different activities or symbols representing daily routines. Use varied colors for each day. Make it look like a weekly planner visualization. NO TEXT OR DAY NAMES.",
  
  'family-members': "Create a warm, friendly illustration of a Thai family gathering with multiple generations - grandparents, parents, and children. Show them in traditional Thai clothing having a meal together. Make it heartwarming and culturally authentic. NO TEXT OR LABELS.",
  
  'months-of-year': "Create a beautiful illustration showing the cycle of seasons and months in Thailand, with visual representations of weather changes, festivals, and seasonal activities throughout the year. Include elements like rain, sun, flowers blooming. NO TEXT OR MONTH NAMES.",
  
  'body-parts': "Create an educational illustration showing a friendly cartoon character (not too anatomical) with visual indicators pointing to different body parts. Make it child-friendly and educational, like a fun anatomy poster. NO TEXT OR LABELS.",
  
  // 100 Most Common Words sets
  'common-words-1': "Create an artistic collage showing everyday Thai life activities - people talking, eating, going places, helping each other. Include various emotions and interactions. Modern Thai urban setting with warm colors. NO TEXT.",
  'common-words-2': "Create a vibrant scene of Thai people in various activities - friends meeting, people working, shopping at markets, expressing likes and needs. Show diversity of ages and situations. NO TEXT.",
  'common-words-3': "Create a bustling Thai street scene with people eating at food stalls, going home, sleeping, working together. Include day and night activities. Warm, inviting atmosphere. NO TEXT.",
  'common-words-4': "Create an illustration showing emotions and relationships - people thinking, loving, happy faces, waiting, new and old items contrasted. Thai cultural context with modern elements. NO TEXT.",
  'common-words-5': "Create a Thai food market scene with rice dishes, chicken, pork, vegetables, and people eating together. Show understanding through gestures and expressions. Colorful and appetizing. NO TEXT.",
  'common-words-6': "Create a scene showing contrasts - before/after, same/different, open/closed, right/wrong. Use Thai architectural elements and daily life situations. Clear visual storytelling. NO TEXT.",
  'common-words-7': "Create a Thai café scene with people drinking coffee and tea, eating fruits and vegetables, fish dishes. Show different food and beverage options in a modern setting. NO TEXT.",
  'common-words-8': "Create a Thai city scene with cars, taxis, phones, different rooms and buildings. Show urban life with people together and alone. Modern Bangkok-style setting. NO TEXT.",
  'common-words-9': "Create scenes of Thai daily life including markets, hospitals, police, showing easy and difficult tasks, young and old people. Community-focused illustration. NO TEXT.",
  'common-words-10': "Create a scene showing directions (left, right, straight), times of day (morning, evening, night), and celebration. Include Thai architectural elements for navigation context. NO TEXT."
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

export async function POST() {
  console.log('Starting to generate images for default sets...');
  
  const results = [];
  
  for (let i = 0; i < ALL_DEFAULT_SETS.length; i++) {
    const set = ALL_DEFAULT_SETS[i];
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