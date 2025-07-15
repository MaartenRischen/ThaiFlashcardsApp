// Basic Thai word breakdown utility
// This provides a simple word-by-word breakdown for learning purposes

interface WordBreakdown {
  thai: string;
  pronunciation: string;
  english: string;
}

interface PhraseBreakdown {
  words: WordBreakdown[];
  literalTranslation?: string;
}

// Common Thai words dictionary for basic breakdowns
const COMMON_THAI_WORDS: Record<string, { pronunciation: string; english: string }> = {
  // Pronouns
  'ผม': { pronunciation: 'phom', english: 'I (male)' },
  'ฉัน': { pronunciation: 'chan', english: 'I (female)' },
  'ดิฉัน': { pronunciation: 'di-chan', english: 'I (formal female)' },
  'คุณ': { pronunciation: 'khun', english: 'you' },
  'เขา': { pronunciation: 'khao', english: 'he/she' },
  'เรา': { pronunciation: 'rao', english: 'we' },
  'พวกเขา': { pronunciation: 'phuak-khao', english: 'they' },
  
  // Common verbs
  'เป็น': { pronunciation: 'pen', english: 'to be' },
  'มี': { pronunciation: 'mee', english: 'to have' },
  'ไป': { pronunciation: 'pai', english: 'to go' },
  'มา': { pronunciation: 'ma', english: 'to come' },
  'ทำ': { pronunciation: 'tham', english: 'to do/make' },
  'กิน': { pronunciation: 'gin', english: 'to eat' },
  'ดื่ม': { pronunciation: 'deum', english: 'to drink' },
  'อยู่': { pronunciation: 'yoo', english: 'to be at/live' },
  'ชอบ': { pronunciation: 'chop', english: 'to like' },
  'รัก': { pronunciation: 'rak', english: 'to love' },
  'อยาก': { pronunciation: 'yaak', english: 'to want' },
  'ต้องการ': { pronunciation: 'tong-gaan', english: 'to need' },
  
  // Common nouns
  'อาหาร': { pronunciation: 'a-han', english: 'food' },
  'น้ำ': { pronunciation: 'nam', english: 'water' },
  'บ้าน': { pronunciation: 'baan', english: 'house/home' },
  'คน': { pronunciation: 'khon', english: 'person' },
  'เงิน': { pronunciation: 'ngern', english: 'money' },
  'เวลา': { pronunciation: 'weh-la', english: 'time' },
  'วัน': { pronunciation: 'wan', english: 'day' },
  'ปี': { pronunciation: 'pee', english: 'year' },
  
  // Common adjectives
  'ดี': { pronunciation: 'dee', english: 'good' },
  'ไม่ดี': { pronunciation: 'mai dee', english: 'not good' },
  'สวย': { pronunciation: 'suay', english: 'beautiful' },
  'หล่อ': { pronunciation: 'lor', english: 'handsome' },
  'ใหญ่': { pronunciation: 'yai', english: 'big' },
  'เล็ก': { pronunciation: 'lek', english: 'small' },
  'ร้อน': { pronunciation: 'ron', english: 'hot' },
  'หนาว': { pronunciation: 'nao', english: 'cold' },
  'อร่อย': { pronunciation: 'a-roi', english: 'delicious' },
  
  // Question words
  'อะไร': { pronunciation: 'a-rai', english: 'what' },
  'ที่ไหน': { pronunciation: 'tee-nai', english: 'where' },
  'ทำไม': { pronunciation: 'tam-mai', english: 'why' },
  'เมื่อไร': { pronunciation: 'meua-rai', english: 'when' },
  'ใคร': { pronunciation: 'khrai', english: 'who' },
  'อย่างไร': { pronunciation: 'yang-rai', english: 'how' },
  
  // Common particles and connectors
  'และ': { pronunciation: 'lae', english: 'and' },
  'หรือ': { pronunciation: 'reu', english: 'or' },
  'แต่': { pronunciation: 'tae', english: 'but' },
  'กับ': { pronunciation: 'gap', english: 'with' },
  'ของ': { pronunciation: 'khong', english: 'of/belonging to' },
  'ใน': { pronunciation: 'nai', english: 'in' },
  'ที่': { pronunciation: 'tee', english: 'at/that' },
  
  // Polite particles
  'ครับ': { pronunciation: 'khrap', english: 'polite particle (male)' },
  'ค่ะ': { pronunciation: 'kha', english: 'polite particle (female)' },
  'คะ': { pronunciation: 'kha', english: 'polite particle (female question)' },
  
  // Common phrases as single units
  'สวัสดี': { pronunciation: 'sa-wat-dee', english: 'hello' },
  'ขอโทษ': { pronunciation: 'khor-thot', english: 'sorry/excuse me' },
  'ขอบคุณ': { pronunciation: 'khop-khun', english: 'thank you' },
  'ไม่เป็นไร': { pronunciation: 'mai-pen-rai', english: "it's okay/never mind" },
  
  // Negation
  'ไม่': { pronunciation: 'mai', english: 'not' },
  'ไม่ใช่': { pronunciation: 'mai-chai', english: 'is not' },
};

/**
 * Attempts to break down a Thai phrase into individual words
 * This is a basic implementation that can be enhanced with a proper Thai NLP library
 */
export function breakdownThaiPhrase(
  thai: string, 
  pronunciation: string, 
  english: string
): PhraseBreakdown {
  const words: WordBreakdown[] = [];
  
  // Remove polite particles from the end for analysis
  const cleanThai = thai.replace(/ครับ|ค่ะ|คะ$/, '').trim();
  const hasPoliteParticle = thai !== cleanThai;
  const politeParticle = thai.substring(cleanThai.length).trim();
  
  // Try to find known words in the phrase
  let remainingThai = cleanThai;
  let foundWords: Array<{ word: string; info: { pronunciation: string; english: string }; position: number }> = [];
  
  // Find all occurrences of known words
  for (const [word, info] of Object.entries(COMMON_THAI_WORDS)) {
    let index = remainingThai.indexOf(word);
    while (index !== -1) {
      foundWords.push({ word, info, position: index });
      index = remainingThai.indexOf(word, index + 1);
    }
  }
  
  // Sort by position to process in order
  foundWords.sort((a, b) => a.position - b.position);
  
  // Build the breakdown
  let lastEndPosition = 0;
  for (const found of foundWords) {
    // Add any unknown text before this word
    if (found.position > lastEndPosition) {
      const unknownText = remainingThai.substring(lastEndPosition, found.position);
      if (unknownText.trim()) {
        words.push({
          thai: unknownText,
          pronunciation: '...',
          english: '...'
        });
      }
    }
    
    // Add the known word
    words.push({
      thai: found.word,
      pronunciation: found.info.pronunciation,
      english: found.info.english
    });
    
    lastEndPosition = found.position + found.word.length;
  }
  
  // Add any remaining unknown text
  if (lastEndPosition < remainingThai.length) {
    const unknownText = remainingThai.substring(lastEndPosition);
    if (unknownText.trim()) {
      words.push({
        thai: unknownText,
        pronunciation: '...',
        english: '...'
      });
    }
  }
  
  // Add polite particle if present
  if (hasPoliteParticle && politeParticle) {
    const particleInfo = COMMON_THAI_WORDS[politeParticle];
    if (particleInfo) {
      words.push({
        thai: politeParticle,
        pronunciation: particleInfo.pronunciation,
        english: particleInfo.english
      });
    }
  }
  
  // If no words were found, return the whole phrase as unknown
  if (words.length === 0) {
    words.push({
      thai: thai,
      pronunciation: pronunciation,
      english: english
    });
  }
  
  // Generate a literal translation by combining the English parts
  const literalParts = words.map(w => w.english).filter(e => e !== '...');
  const literalTranslation = literalParts.length > 0 ? literalParts.join(' ') : undefined;
  
  return {
    words,
    literalTranslation
  };
}

/**
 * Formats a phrase breakdown for display
 */
export function formatBreakdown(breakdown: PhraseBreakdown): {
  inline: string;
  detailed: Array<{ thai: string; pronunciation: string; english: string }>;
} {
  const inline = breakdown.words
    .map(w => `${w.thai} (${w.english})`)
    .join(' ');
  
  return {
    inline,
    detailed: breakdown.words
  };
} 