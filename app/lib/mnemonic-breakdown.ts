/**
 * Enhanced Mnemonic Generation with Sentence Breakdown
 * 
 * For long/complex sentences, this module breaks them down into
 * key words and generates individual mnemonics for each component.
 */

import { cleanPronunciationForMnemonic, THAI_PRONOUNS } from './mnemonic-rules';

export interface WordBreakdown {
  thai: string;
  pronunciation: string;
  english: string;
  mnemonic: string;
}

export interface BreakdownMnemonic {
  type: 'breakdown';
  components: WordBreakdown[];
  fullPhrase: {
    thai: string;
    pronunciation: string;
    english: string;
  };
}

/**
 * Thai words to skip when creating mnemonics (common particles, pronouns)
 */
const SKIP_WORDS = [
  // Pronouns
  'ผม', 'ฉัน', 'ดิฉัน', 'เขา', 'เธอ', 'มัน', 'พวกเขา', 'เรา',
  // Common particles
  'ครับ', 'ค่ะ', 'คะ', 'จ้ะ', 'จ๊ะ', 'นะ', 'สิ', 'หรอ', 'หรือ',
  // Common function words that don't need mnemonics
  'ที่', 'และ', 'แต่', 'หรือ', 'เพื่อ', 'กับ', 'ของ', 'ใน', 'บน', 'ใต้',
  // Common verbs that appear in many phrases
  'เป็น', 'มี', 'ได้', 'ไป', 'มา', 'อยู่'
];

/**
 * Words to always include in breakdown (important content words)
 */
const PRIORITY_PATTERNS = [
  // Question words
  /ไหน|อะไร|ใคร|เมื่อไร|ทำไม|อย่างไร|เท่าไร/,
  // Key verbs
  /อยาก|ต้องการ|ชอบ|รัก|กิน|ดื่ม|ทำงาน|เรียน|ซื้อ|ขาย|เดิน|วิ่ง|นอน|ตื่น/,
  // Important nouns
  /บ้าน|โรงเรียน|โรงพยาบาล|ร้าน|ตลาด|อาหาร|น้ำ|รถ|เงิน|เวลา|วัน|คน|เด็ก/,
  // Descriptive words
  /ดี|ไม่ดี|สวย|หล่อ|ใหญ่|เล็ก|ร้อน|หนาว|แพง|ถูก|ใหม่|เก่า/
];

/**
 * Check if a phrase should be broken down into components
 */
export function shouldBreakdown(thai: string, english: string, pronunciation: string): boolean {
  const wordCount = english.split(' ').length;
  const thaiLength = thai.length;
  const pronunciationWords = pronunciation.split(/[\s\-]+/).length;
  
  // Break down if:
  // 1. English translation is more than 8 words
  // 2. Thai text is more than 30 characters
  // 3. Pronunciation has more than 10 syllables
  // 4. The sentence contains multiple clauses (indicated by commas, "and", "but", etc.)
  return (
    wordCount > 8 ||
    thaiLength > 30 ||
    pronunciationWords > 10 ||
    /,|and|but|because|when|if|that/.test(english)
  );
}

/**
 * Extract key words from a Thai sentence for mnemonic generation
 */
export function extractKeyWords(
  thai: string,
  pronunciation: string,
  english: string
): { thaiWords: string[], pronunciations: string[], englishWords: string[] } {
  // Split Thai text into words (Thai doesn't use spaces)
  const thaiWords: string[] = [];
  const pronunciations: string[] = [];
  const englishWords: string[] = [];
  
  // This is a simplified approach - in production, you'd use a proper Thai tokenizer
  // For now, we'll use the pronunciation to guide word boundaries
  const pronWords = pronunciation.split(/[\s\-]+/);
  
  // Identify key words based on:
  // 1. Not in skip list
  // 2. Matches priority patterns
  // 3. Longer than 2 characters
  // 4. Has clear English meaning
  
  // Parse Thai text looking for important words
  let currentPos = 0;
  const importantWords: Array<{ thai: string, start: number, end: number }> = [];
  
  for (const pattern of PRIORITY_PATTERNS) {
    const matches = thai.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      if (match.index !== undefined) {
        importantWords.push({
          thai: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
  }
  
  // Sort by position and remove overlaps
  importantWords.sort((a, b) => a.start - b.start);
  const finalWords: typeof importantWords = [];
  
  for (const word of importantWords) {
    if (finalWords.length === 0 || word.start >= finalWords[finalWords.length - 1].end) {
      finalWords.push(word);
    }
  }
  
  // For each important word, find its pronunciation
  // This is simplified - in production you'd use proper alignment
  if (finalWords.length > 0) {
    // Take up to 5 most important words
    const selectedWords = finalWords.slice(0, 5);
    
    // Distribute pronunciations evenly
    const pronChunks = Math.ceil(pronWords.length / selectedWords.length);
    
    selectedWords.forEach((word, index) => {
      thaiWords.push(word.thai);
      
      // Get corresponding pronunciation chunk
      const startIdx = index * pronChunks;
      const endIdx = Math.min((index + 1) * pronChunks, pronWords.length);
      pronunciations.push(pronWords.slice(startIdx, endIdx).join(' '));
      
      // Try to extract English meaning for this word
      // This is very simplified - in production you'd use proper translation
      englishWords.push(extractEnglishMeaning(word.thai, english));
    });
  }
  
  // If no priority words found, fall back to extracting 3-4 key syllables
  if (thaiWords.length === 0) {
    const keyPronIndices = [
      0, // First word
      Math.floor(pronWords.length / 2), // Middle word
      pronWords.length - 1 // Last word
    ];
    
    keyPronIndices.forEach(idx => {
      if (idx < pronWords.length && pronWords[idx].length > 2) {
        pronunciations.push(pronWords[idx]);
        thaiWords.push(''); // Empty since we don't have Thai word boundaries
        englishWords.push(''); // Will be filled by context
      }
    });
  }
  
  return { thaiWords, pronunciations, englishWords };
}

/**
 * Simple helper to extract English meaning for a Thai word
 * In production, this would use a dictionary or translation API
 */
function extractEnglishMeaning(thaiWord: string, fullEnglish: string): string {
  // Common word mappings
  const commonMappings: Record<string, string> = {
    'ไหน': 'where',
    'อะไร': 'what', 
    'ใคร': 'who',
    'เมื่อไร': 'when',
    'ทำไม': 'why',
    'อย่างไร': 'how',
    'เท่าไร': 'how much',
    'อยาก': 'want',
    'ต้องการ': 'need',
    'ชอบ': 'like',
    'รัก': 'love',
    'กิน': 'eat',
    'ดื่ม': 'drink',
    'ไป': 'go',
    'มา': 'come',
    'บ้าน': 'house/home',
    'โรงเรียน': 'school',
    'อาหาร': 'food',
    'น้ำ': 'water',
    'เงิน': 'money',
    'คน': 'person',
    'ดี': 'good',
    'ใหญ่': 'big',
    'เล็ก': 'small'
  };
  
  return commonMappings[thaiWord] || thaiWord;
}

/**
 * Format a breakdown mnemonic for display
 */
export function formatBreakdownMnemonic(breakdown: BreakdownMnemonic): string {
  let result = `For "${breakdown.fullPhrase.english}":\n\n`;
  result += 'Remember these key parts:\n';
  
  breakdown.components.forEach((component, index) => {
    const bullet = index === 0 ? '•' : '•';
    if (component.thai) {
      result += `${bullet} ${component.thai} (${component.pronunciation}) = "${component.english}"\n`;
      result += `  → ${component.mnemonic}\n`;
    } else {
      // Just pronunciation without Thai
      result += `${bullet} "${component.pronunciation}" → ${component.mnemonic}\n`;
    }
  });
  
  return result.trim();
}

/**
 * Check if an existing mnemonic is just repeating pronunciation/translation
 */
export function isInvalidMnemonic(mnemonic: string, pronunciation: string, english: string): boolean {
  const mnemonicLower = mnemonic.toLowerCase();
  const pronLower = pronunciation.toLowerCase();
  const englishLower = english.toLowerCase();
  
  // Check if mnemonic is just repeating the pronunciation
  if (mnemonicLower.includes(pronLower) || 
      mnemonicLower.includes(pronLower.replace(/[\s\-]/g, ''))) {
    // Check if it's ONLY pronunciation (no creative elements)
    const withoutPron = mnemonicLower.replace(pronLower, '').replace(pronLower.replace(/[\s\-]/g, ''), '');
    if (withoutPron.length < 20) { // Too little additional content
      return true;
    }
  }
  
  // Check if it's just "I think: [pronunciation] - [translation]" pattern
  if (mnemonicLower.includes('i think:') && 
      mnemonicLower.includes(englishLower) &&
      !mnemonicLower.includes('sounds like') &&
      !mnemonicLower.includes('think of') &&
      !mnemonicLower.includes('imagine')) {
    return true;
  }
  
  // Check if it lacks any phonetic word play
  const phoneticKeywords = ['sounds like', 'think:', 'imagine', 'picture', 'like a', 'as if', 'rhymes'];
  if (!phoneticKeywords.some(keyword => mnemonicLower.includes(keyword))) {
    return true;
  }
  
  return false;
}
