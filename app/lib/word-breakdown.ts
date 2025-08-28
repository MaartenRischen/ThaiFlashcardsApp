/**
 * Word breakdown functionality for Thai phrases
 */

export interface WordBreakdown {
  thai: string;
  pronunciation: string;
  english: string;
  isParticle?: boolean; // For words like ครับ/ค่ะ
  isCompound?: boolean; // For compound meanings
}

export interface PhraseBreakdown {
  fullPhrase: {
    thai: string;
    pronunciation: string;
    english: string;
  };
  words: WordBreakdown[];
  compounds?: WordBreakdown[]; // Additional compound meanings
}

/**
 * Common Thai particles and their meanings
 */
const PARTICLES: Record<string, { pronunciation: string; english: string }> = {
  'ครับ': { pronunciation: 'krap', english: '(polite particle - male)' },
  'ค่ะ': { pronunciation: 'ka', english: '(polite particle - female)' },
  'คะ': { pronunciation: 'ka', english: '(polite particle - female, question)' },
  'นะ': { pronunciation: 'na', english: '(softening particle)' },
  'สิ': { pronunciation: 'si', english: '(emphasis particle)' },
  'หรอ': { pronunciation: 'ror', english: '(questioning particle)' },
  'ล่ะ': { pronunciation: 'la', english: '(then/what about)' },
  'นะครับ': { pronunciation: 'na krap', english: '(softening - male)' },
  'นะคะ': { pronunciation: 'na ka', english: '(softening - female)' },
};

/**
 * Common Thai function words
 */
const _FUNCTION_WORDS: Record<string, { pronunciation: string; english: string }> = {
  'ที่': { pronunciation: 'tee', english: 'that/which/at' },
  'ของ': { pronunciation: 'khong', english: "of/'s" },
  'และ': { pronunciation: 'lae', english: 'and' },
  'หรือ': { pronunciation: 'rue', english: 'or' },
  'แต่': { pronunciation: 'tae', english: 'but' },
  'กับ': { pronunciation: 'gap', english: 'with' },
  'ใน': { pronunciation: 'nai', english: 'in' },
  'บน': { pronunciation: 'bon', english: 'on' },
  'ใต้': { pronunciation: 'tai', english: 'under' },
  'ข้าง': { pronunciation: 'khang', english: 'beside' },
  'หน้า': { pronunciation: 'naa', english: 'front/face' },
  'หลัง': { pronunciation: 'lang', english: 'back/after' },
  'ก่อน': { pronunciation: 'gon', english: 'before' },
  'หลังจาก': { pronunciation: 'lang jaak', english: 'after' },
  'เพราะ': { pronunciation: 'phro', english: 'because' },
  'ถ้า': { pronunciation: 'taa', english: 'if' },
  'เมื่อ': { pronunciation: 'muea', english: 'when' },
  'ว่า': { pronunciation: 'waa', english: 'that (conjunction)' },
};

/**
 * Extract particles from the end of a phrase
 */
function _extractParticles(thai: string): { main: string; particles: string[] } {
  let main = thai;
  const particles: string[] = [];
  
  // Check for compound particles first
  for (const particle of ['นะครับ', 'นะคะ', 'นะค่ะ']) {
    if (main.endsWith(particle)) {
      particles.push(particle);
      main = main.slice(0, -particle.length).trim();
      break;
    }
  }
  
  // Then check for single particles
  for (const particle of Object.keys(PARTICLES)) {
    if (main.endsWith(particle) && !particles.includes(particle)) {
      particles.push(particle);
      main = main.slice(0, -particle.length).trim();
      break;
    }
  }
  
  return { main, particles };
}

/**
 * Parse a word breakdown from LLM response
 */
export function parseWordBreakdown(llmResponse: string): PhraseBreakdown | null {
  try {
    // Remove markdown code blocks if present
    let cleanResponse = llmResponse;
    if (llmResponse.includes('```json')) {
      cleanResponse = llmResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (llmResponse.includes('```')) {
      cleanResponse = llmResponse.replace(/```\s*/g, '');
    }
    
    // Try to parse as JSON
    const parsed = JSON.parse(cleanResponse.trim());
    return parsed as PhraseBreakdown;
  } catch {
    // If not JSON, try to parse structured text
    // This is a fallback for non-JSON responses
    console.error('Failed to parse word breakdown response');
    return null;
  }
}

/**
 * Format a phrase breakdown for display
 */
export function formatBreakdownDisplay(breakdown: PhraseBreakdown): string {
  const lines: string[] = [];
  
  // Add individual words
  breakdown.words.forEach(word => {
    const particle = word.isParticle ? ' ' : '';
    lines.push(`${word.thai} (${word.pronunciation})${particle} = ${word.english}`);
  });
  
  // Add compound meanings if any
  if (breakdown.compounds && breakdown.compounds.length > 0) {
    lines.push(''); // Empty line
    lines.push('Compound meanings:');
    breakdown.compounds.forEach(compound => {
      lines.push(`${compound.thai} (${compound.pronunciation}) = ${compound.english}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Create a prompt for LLM to break down a Thai phrase
 */
export function createBreakdownPrompt(thai: string, pronunciation: string, english: string): string {
  return `Break down this Thai phrase word by word, showing what each part means:

Thai: ${thai}
Pronunciation: ${pronunciation}
English: ${english}

Provide a JSON response with this exact structure:
{
  "fullPhrase": {
    "thai": "${thai}",
    "pronunciation": "${pronunciation}",
    "english": "${english}"
  },
  "words": [
    {
      "thai": "Thai word",
      "pronunciation": "pronunciation",
      "english": "meaning",
      "isParticle": true/false,
      "isCompound": false
    }
  ],
  "compounds": [
    {
      "thai": "compound phrase",
      "pronunciation": "pronunciation",
      "english": "compound meaning",
      "isCompound": true
    }
  ]
}

Rules:
1. Break down every word in order
2. Mark particles (ครับ/ค่ะ/นะ etc) with isParticle: true
3. Include compound meanings that are important for understanding
4. Keep pronunciations in the same romanization style as provided
5. For pronouns, show both options: ผม/ฉัน as "I (male/female)"

Example breakdown for "ผมพูดไทยไม่ค่อยเก่งครับ":
{
  "fullPhrase": {
    "thai": "ผมพูดไทยไม่ค่อยเก่งครับ",
    "pronunciation": "phom phuut thai mai khoi geng krap",
    "english": "I don't speak Thai very well"
  },
  "words": [
    { "thai": "ผม", "pronunciation": "phom", "english": "I (male)" },
    { "thai": "พูด", "pronunciation": "phuut", "english": "speak" },
    { "thai": "ไทย", "pronunciation": "thai", "english": "Thai" },
    { "thai": "ไม่", "pronunciation": "mai", "english": "not" },
    { "thai": "ค่อย", "pronunciation": "khoi", "english": "quite/very" },
    { "thai": "เก่ง", "pronunciation": "geng", "english": "good at/skilled" },
    { "thai": "ครับ", "pronunciation": "krap", "english": "(polite particle - male)", "isParticle": true }
  ],
  "compounds": [
    { "thai": "พูดไทย", "pronunciation": "phuut thai", "english": "speak Thai", "isCompound": true },
    { "thai": "ไม่ค่อย", "pronunciation": "mai khoi", "english": "not very/not quite", "isCompound": true },
    { "thai": "ไม่ค่อยเก่ง", "pronunciation": "mai khoi geng", "english": "not very good at", "isCompound": true }
  ]
}

Return ONLY the JSON, no additional text.`;
}

/**
 * Cached breakdowns to avoid repeated API calls
 */
const breakdownCache = new Map<string, PhraseBreakdown>();

// Pre-generated breakdown cache
let preGeneratedCache: Record<string, any> = {};

// Load pre-generated cache on module initialization
if (typeof window === 'undefined') {
  // Server-side: try to load from file
  try {
    const fs = require('fs');
    const path = require('path');
    const cacheFile = path.join(process.cwd(), 'app', 'data', 'breakdown-cache.json');
    if (fs.existsSync(cacheFile)) {
      preGeneratedCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      console.log(`Loaded ${Object.keys(preGeneratedCache).length} pre-generated breakdowns`);
    }
  } catch (error) {
    console.error('Failed to load pre-generated cache:', error);
  }
}

export function getCachedBreakdown(cacheKey: string): PhraseBreakdown | null {
  // Check runtime cache first
  if (breakdownCache.has(cacheKey)) {
    return breakdownCache.get(cacheKey) || null;
  }
  
  // Check pre-generated cache
  if (preGeneratedCache[cacheKey]) {
    const breakdown = preGeneratedCache[cacheKey];
    // Store in runtime cache for faster access
    breakdownCache.set(cacheKey, breakdown);
    return breakdown;
  }
  
  return null;
}

export function setCachedBreakdown(cacheKey: string, breakdown: PhraseBreakdown): void {
  breakdownCache.set(cacheKey, breakdown);
}