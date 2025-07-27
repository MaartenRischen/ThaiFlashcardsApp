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
  'numbers-1-10': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Numbers and counting from 1 to 10" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: counting blocks, dice, abacus beads, donkey holding balloons in groups, stepping stones on bridge numbered visually.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'basic-colors': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Basic colors - rainbow and colorful objects" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: rainbow arching over bridge, colorful balloons held by donkey, paint buckets, colorful flowers, donkey with different colored spots or patches.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'days-of-week': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Days of the week - weekly cycle and activities" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: circular calendar wheel, sun and moon symbols, donkey doing different activities, weekly planner visual, seven stepping stones on bridge.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'family-members': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Family members - different generations" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: multiple donkeys of different sizes representing family members, baby donkey, elderly donkey with glasses, parent donkeys, family gathering on bridge, family tree shape.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'months-of-year': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Months of the year - seasonal cycle in Thailand" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: seasonal weather symbols, flowers blooming, rain clouds, sun symbols, donkey with umbrella, bridge showing different seasons on each section.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'body-parts': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Body parts - educational anatomy" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: donkey in educational pose showing different body parts clearly, anatomical indicators, friendly donkey pointing to its ears/nose/hooves, educational diagram style, x-ray vision effect showing bones.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'weather-terms': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Weather conditions - sun, rain, storms, clouds" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: sun rays, rain drops, storm clouds, lightning bolts, donkey with umbrella, rainbow after rain, wind effects, weather vane on bridge.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'time-expressions': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Time of day - morning, afternoon, evening, night" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: sun positions showing time progression, sunrise colors, sunset hues, moon and stars, clock tower near bridge, donkey doing time-specific activities.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'formal-business': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Formal business and professional settings" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: donkey in business suit and tie, briefcase, office buildings in background, presentation board, handshake between donkeys, professional meeting setup on bridge.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`,
  
  'thai-proverbs': `Create a cute cartoon style illustration with these STRICT REQUIREMENTS:
1. MAIN FOCUS: Create a purely visual representation of "Thai wisdom and traditional proverbs" without ANY text or writing.
2. MANDATORY ELEMENTS: Include at least one friendly donkey AND a bridge (bridge can be in background if needed).
3. STYLE: Use vibrant, friendly colors and a clean cartoon style.
4. CRITICAL TEXT PROHIBITION: The image MUST NOT contain ANY:
   - Text, letters, numbers, or writing of any kind
   - Signs, labels, logos, or watermarks
   - Hidden or subtle text elements
   - Text-like patterns or shapes
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: wise elderly donkey with traditional Thai elements, lotus flowers, golden temple shapes, meditation pose, traditional Thai patterns on bridge, scroll or ancient book.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements.`
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