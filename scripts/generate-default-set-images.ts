#!/usr/bin/env ts-node

/**
 * Script to generate images for all default sets
 * Run with: npx ts-node scripts/generate-default-set-images.ts
 */

import { DEFAULT_SETS } from '../app/data/default-sets';
import { generateImage } from '../app/lib/ideogram-service';
import fs from 'fs';
import path from 'path';
import https from 'https';

// Prompts for each default set
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

async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function generateDefaultSetImages() {
  console.log('Starting to generate images for default sets...');
  
  // Create directory if it doesn't exist
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'defaults');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('Created directory:', imagesDir);
  }
  
  for (let i = 0; i < DEFAULT_SETS.length; i++) {
    const set = DEFAULT_SETS[i];
    const prompt = IMAGE_PROMPTS[set.id];
    
    if (!prompt) {
      console.error(`No prompt found for set: ${set.name}`);
      continue;
    }
    
    console.log(`\nGenerating image for: ${set.name}`);
    console.log(`Prompt: ${prompt.substring(0, 100)}...`);
    
    try {
      const imageUrl = await generateImage(prompt);
      
      if (imageUrl) {
        // Download the image
        const filename = `default-thailand-${(i + 1).toString().padStart(2, '0')}.png`;
        const filepath = path.join(imagesDir, filename);
        
        console.log(`Downloading image to: ${filepath}`);
        await downloadImage(imageUrl, filepath);
        
        console.log(`✓ Successfully generated and saved image for: ${set.name}`);
        console.log(`  Image URL: ${imageUrl}`);
        console.log(`  Saved as: ${filename}`);
      } else {
        console.error(`✗ Failed to generate image for: ${set.name}`);
      }
      
      // Add a delay to avoid rate limiting
      console.log('Waiting 3 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`✗ Error generating image for ${set.name}:`, error);
    }
  }
  
  console.log('\nImage generation complete!');
}

// Run the script
generateDefaultSetImages().catch(console.error); 