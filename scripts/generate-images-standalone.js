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
   - NO calendar text, NO day names, NO abbreviations like MON/TUE/WED etc.
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: colorful wheel with seven sections (NO TEXT), sun and moon symbols, donkey doing different activities for each day, seven stepping stones on bridge, weekly routine symbols.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements. ABSOLUTELY NO TEXT ON THE CALENDAR WHEEL.`,
  
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
   - NO body part labels, NO anatomical text, NO medical terms
5. NO OTHER CREATURES: The image MUST NOT contain:
   - Any animals other than donkeys
   - No humans, people, or human figures
   - No other living creatures (birds, insects, etc.)
   - Only donkeys are allowed as living beings
6. COMPOSITION: Create a balanced 16:9 landscape composition where the topic-specific elements are prominent.
7. QUALITY: Focus on high detail and clean lines.
8. CONTEXTUAL ELEMENTS: Include these specific visual elements that represent the topic: donkey in educational pose with clearly visible body parts, colorful arrows or indicators pointing to different parts (NO TEXT LABELS), friendly donkey showing ears/nose/hooves/tail clearly, simple anatomical highlighting with colors only.
Remember: The bridge can be small or in the background if it helps better showcase the topic-specific elements. USE ONLY VISUAL INDICATORS, NO TEXT LABELS ON BODY PARTS.`,
  
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

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    https.get(url, (response) => {
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      
      response.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function main() {
  console.log('Regenerating only the two images with text issues...');
  console.log(`API Key available: ${Boolean(process.env.IDEOGRAM_API_KEY)}`);

  // Only regenerate these two problematic images
  const imagesToRegenerate = [
    { index: 2, set: DEFAULT_SETS[2] }, // days-of-week (default-thailand-03.png)
    { index: 5, set: DEFAULT_SETS[5] }  // body-parts (default-thailand-06.png)
  ];

  for (let i = 0; i < imagesToRegenerate.length; i++) {
    const { index, set } = imagesToRegenerate[i];
    
    console.log(`\n[${i + 1}/2] Regenerating image for: ${set.name}`);
    
    const prompt = IMAGE_PROMPTS[set.id];
    if (!prompt) {
      console.error(`  No prompt found for ${set.id}`);
      continue;
    }

    try {
      const imageUrl = await generateImage(prompt);
      
      if (imageUrl) {
        console.log('  Downloading image...');
        const imageBuffer = await downloadImage(imageUrl);
        
        const filename = `default-thailand-${(index + 1).toString().padStart(2, '0')}.png`;
        const filepath = path.join(__dirname, '..', 'public', 'images', 'defaults', filename);
        
        fs.writeFileSync(filepath, imageBuffer);
        console.log(`  ✓ Success! Saved as: ${filename}`);
        
        if (i < imagesToRegenerate.length - 1) {
          console.log('  Waiting 3 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } else {
        console.error(`  Failed to generate image for ${set.name}`);
      }
    } catch (error) {
      console.error(`  Error generating image for ${set.name}:`, error.message);
    }
  }

  console.log('\n✅ Regeneration of problematic images complete!');
}

main().catch(console.error); 