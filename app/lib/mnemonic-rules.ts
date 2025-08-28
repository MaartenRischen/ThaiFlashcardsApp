/**
 * Mnemonic Generation Rules for Thai Flashcards
 * 
 * This module defines rules for creating effective mnemonics that:
 * 1. Are phonetically similar to Thai pronunciation
 * 2. Help remember the meaning
 * 3. Avoid gender-specific pronouns
 * 4. Work well for both words and sentences
 */

export interface MnemonicRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Common Thai pronouns that should be avoided in mnemonics
export const THAI_PRONOUNS = {
  male: ['pǒm', 'pom', 'phom', 'ผม'],
  female: ['chǎn', 'chan', 'ฉัน', 'dichǎn', 'dichan', 'ดิฉัน'],
  neutral: ['khun', 'คุณ', 'rao', 'เรา', 'khao', 'เขา'],
  all: [] as string[] // Will be populated
};

THAI_PRONOUNS.all = [
  ...THAI_PRONOUNS.male,
  ...THAI_PRONOUNS.female,
  ...THAI_PRONOUNS.neutral
];

/**
 * Rules for cleaning pronunciations before creating mnemonics
 */
export const PRONUNCIATION_CLEANUP_RULES: MnemonicRule[] = [
  {
    pattern: /\b(chǎn|chan|pǒm|pom|phom)\/?(chǎn|chan|pǒm|pom|phom)?\b/gi,
    replacement: 'I',
    description: 'Replace gendered pronouns with neutral "I"'
  },
  {
    pattern: /\b(kráp|krap|krub|ká|ka|khá|kha)\b/gi,
    replacement: '',
    description: 'Remove politeness particles from mnemonics'
  },
  {
    pattern: /\s+/g,
    replacement: ' ',
    description: 'Normalize whitespace'
  }
];

/**
 * Guidelines for creating effective mnemonics
 */
export const MNEMONIC_GUIDELINES = {
  // For single words
  singleWord: {
    maxLength: 100,
    structure: 'Think: "[phonetic sound]" - [meaning connection]',
    examples: [
      'For "สวัสดี" (sà-wàt-dii) = "hello": Think: "Saw what, dee?" - a friendly hello',
      'For "ขอบคุณ" (khɔ̀ɔp-khun) = "thank you": Think: "Cop coon" - cop saying thanks'
    ]
  },
  
  // For short phrases (2-4 words)
  shortPhrase: {
    maxLength: 120,
    structure: 'Think: "[key sounds]" - [situational meaning]',
    examples: [
      'For "ไม่เป็นไร" (mâi pen rai) = "no problem": Think: "My pen rye" - my pen writes, no problem',
      'For "เท่าไหร่" (thâo rài) = "how much": Think: "Tao rye" - Tao asks the price of rye'
    ]
  },
  
  // For long sentences
  longSentence: {
    maxLength: 150,
    structure: 'Think: [key word sounds] - [core meaning]',
    examples: [
      'For a direction sentence: Focus on "sáai/khwǎa" (left/right) sounds',
      'For a question: Focus on the question word sound like "thîi-nǎi" (where)'
    ]
  }
};

/**
 * Clean pronunciation for mnemonic generation
 */
export function cleanPronunciationForMnemonic(pronunciation: string): string {
  let cleaned = pronunciation;
  
  for (const rule of PRONUNCIATION_CLEANUP_RULES) {
    cleaned = cleaned.replace(rule.pattern, rule.replacement);
  }
  
  return cleaned.trim();
}

/**
 * Determine the type of phrase for mnemonic generation
 */
export function getPhraseType(thai: string, english: string): 'single' | 'short' | 'long' {
  const wordCount = english.split(' ').length;
  const thaiLength = thai.length;
  
  if (wordCount <= 2 || thaiLength <= 10) {
    return 'single';
  } else if (wordCount <= 5 || thaiLength <= 20) {
    return 'short';
  } else {
    return 'long';
  }
}

/**
 * Extract key sounds from pronunciation for mnemonic focus
 */
export function extractKeySounds(pronunciation: string, phraseType: 'single' | 'short' | 'long'): string[] {
  const cleaned = cleanPronunciationForMnemonic(pronunciation);
  const words = cleaned.split(' ').filter(w => w.length > 0);
  
  switch (phraseType) {
    case 'single':
      return words; // Use all sounds for single words
    
    case 'short':
      // Focus on first 2-3 key words
      return words.slice(0, 3);
    
    case 'long':
      // Focus on the most important/unique words (usually verbs, nouns)
      // Skip common words like "I", "the", "a"
      return words.filter(w => 
        w.length > 2 && 
        !['the', 'a', 'an', 'to', 'of', 'in', 'on', 'at'].includes(w.toLowerCase())
      ).slice(0, 3);
  }
}

/**
 * Generate a mnemonic prompt for LLM based on phrase type
 */
export function generateMnemonicPrompt(
  thai: string,
  english: string,
  pronunciation: string
): string {
  const phraseType = getPhraseType(thai, english);
  const cleanedPronunciation = cleanPronunciationForMnemonic(pronunciation);
  const keySounds = extractKeySounds(pronunciation, phraseType);
  const guidelines = MNEMONIC_GUIDELINES[
    phraseType === 'single' ? 'singleWord' : 
    phraseType === 'short' ? 'shortPhrase' : 
    'longSentence'
  ];
  
  return `Create a memorable mnemonic for the Thai phrase "${thai}" 
which is pronounced "${cleanedPronunciation}" 
and means "${english}" in English.

CRITICAL REQUIREMENTS:
1. Focus on these key sounds: ${keySounds.join(', ')}
2. Do NOT use gender-specific pronouns (chan/pom) in the mnemonic
3. Do NOT include politeness particles (ka/krap) in the mnemonic
4. The mnemonic MUST contain English words that sound like the Thai pronunciation
5. The mnemonic MUST relate to the meaning "${english}"
6. Keep it under ${guidelines.maxLength} characters
7. Use format: ${guidelines.structure}

${phraseType === 'long' ? 
'For long sentences, focus on 2-3 KEY WORDS that capture the essence, not every word.' : 
'Make sure the sound connection is clear and memorable.'}

Good example patterns:
${guidelines.examples.join('\n')}

Generate a mnemonic following these rules:`;
}

/**
 * Validate that a mnemonic doesn't contain problematic content
 */
export function validateMnemonicContent(mnemonic: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Check for pronouns
  const pronounPattern = new RegExp(
    `\\b(${THAI_PRONOUNS.all.join('|')})\\b`,
    'gi'
  );
  if (pronounPattern.test(mnemonic)) {
    issues.push('Contains gender-specific pronouns');
  }
  
  // Check for politeness particles
  if (/\b(kráp|krap|krub|ká|ka|khá|kha)\b/gi.test(mnemonic)) {
    issues.push('Contains politeness particles');
  }
  
  // Check for actual mnemonic content (not just pronunciation)
  if (mnemonic.toLowerCase().includes('create your own') || 
      mnemonic.toLowerCase().includes('sound association')) {
    issues.push('Mnemonic is placeholder text, not actual memory aid');
  }
  
  // Check minimum length
  if (mnemonic.length < 20) {
    issues.push('Mnemonic too short to be effective');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Generate a fallback mnemonic for common patterns
 */
export function generateFallbackMnemonic(
  pronunciation: string,
  english: string
): string {
  const cleaned = cleanPronunciationForMnemonic(pronunciation);
  const words = cleaned.split(' ').filter(w => w.length > 0);
  
  // For "I want to..." patterns
  if (english.toLowerCase().includes('i want to')) {
    const keyWord = words.find(w => w.includes('yak') || w.includes('yaak')) || words[1];
    return `Think: "yak ${words.slice(1).join(' ')}" - yak wants to ${english.toLowerCase().replace('i want to', '').trim()}`;
  }
  
  // For questions
  if (english.includes('?')) {
    const questionWord = words[0];
    return `Think: "${questionWord}" sounds like asking "${english.replace('?', '')}"`;
  }
  
  // For directions
  if (english.includes('left') || english.includes('right')) {
    const directionSound = words.find(w => 
      w.includes('sai') || w.includes('saai') || 
      w.includes('khwa') || w.includes('khwaa')
    ) || words[words.length - 1];
    return `Think: "${directionSound}" - ${english.includes('left') ? 'sigh left' : 'kwaa right'}`;
  }
  
  // Generic fallback
  const firstSound = words[0];
  const lastSound = words[words.length - 1];
  return `Think: "${firstSound}...${lastSound}" - ${english.toLowerCase()}`;
}
