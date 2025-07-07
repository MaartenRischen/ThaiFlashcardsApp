import { Phrase } from './types';
import { 
  IRREGULAR_PLURALS, 
  PLURAL_ENDINGS, 
  SEMANTIC_GROUPS, 
  COMPOUND_WORDS, 
  VERB_FORMS,
  THAI_PARTICLES
} from './constants';

/**
 * Validates that a phrase has all required fields with valid data
 */
export function isValidPhrase(phrase: unknown): phrase is Phrase {
  if (!phrase || typeof phrase !== 'object' || phrase === null) return false;
  
  const obj = phrase as Record<string, unknown>;
  
  // Check required string fields
  const requiredStrings = ['english', 'thai', 'pronunciation'];
  const hasRequiredStrings = requiredStrings.every(
    field => typeof obj[field] === 'string' && (obj[field] as string).trim().length > 0
  );
  if (!hasRequiredStrings) return false;
  
  // Check gendered variations
  const hasGenderedThai = 
    typeof obj.thaiMasculine === 'string' && (obj.thaiMasculine as string).trim().length > 0 &&
    typeof obj.thaiFeminine === 'string' && (obj.thaiFeminine as string).trim().length > 0;
  if (!hasGenderedThai) return false;
  
  // Check examples array
  if (!Array.isArray(obj.examples) || obj.examples.length < 2) return false;
  
  // Validate each example
  return obj.examples.every((ex: unknown) => {
    if (!ex || typeof ex !== 'object' || ex === null) return false;
    const example = ex as Record<string, unknown>;
    return (
      typeof example.thai === 'string' && (example.thai as string).trim().length > 0 &&
      typeof example.thaiMasculine === 'string' && (example.thaiMasculine as string).trim().length > 0 &&
      typeof example.thaiFeminine === 'string' && (example.thaiFeminine as string).trim().length > 0 &&
      typeof example.pronunciation === 'string' && (example.pronunciation as string).trim().length > 0 &&
      typeof example.translation === 'string' && (example.translation as string).trim().length > 0
    );
  });
}

/**
 * Enhanced English normalization for better duplicate detection
 */
export function normalizeEnglish(english: string): string {
  // Basic cleanup
  let normalized = english.toLowerCase().trim();
  
  // Remove punctuation except apostrophes in contractions
  normalized = normalized.replace(/[^\w\s']/g, '').replace(/'/g, "'");
  
  // Split into words
  let words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  // Remove articles
  words = words.filter(w => !['a', 'an', 'the'].includes(w));
  
  // Handle contractions
  words = words.map(word => {
    const contractions: Record<string, string> = {
      "don't": "do not", "doesn't": "does not", "didn't": "did not",
      "won't": "will not", "wouldn't": "would not", "shouldn't": "should not",
      "can't": "cannot", "couldn't": "could not",
      "i'm": "i am", "you're": "you are", "he's": "he is", "she's": "she is",
      "it's": "it is", "we're": "we are", "they're": "they are",
      "i've": "i have", "you've": "you have", "we've": "we have",
      "i'll": "i will", "you'll": "you will", "he'll": "he will"
    };
    return contractions[word] || word;
  }).flatMap(w => w.split(' '));
  
  // Normalize verb forms
  words = words.map(word => VERB_FORMS[word] || word);
  
  // Handle plurals
  words = words.map(word => {
    // Check irregular plurals first
    if (word in IRREGULAR_PLURALS) {
      return IRREGULAR_PLURALS[word];
    }
    
    // Check regular plural endings
    for (const ending of PLURAL_ENDINGS) {
      if (word.endsWith(ending)) {
        const singular = word.endsWith('ies') 
          ? word.slice(0, -3) + 'y'  // babies -> baby
          : word.slice(0, -ending.length);  // cats -> cat
        return singular;
      }
    }
    return word;
  });
  
  // Handle semantic groups
  words = words.map(word => {
    for (const [primary, synonyms] of Object.entries(SEMANTIC_GROUPS)) {
      if (synonyms.includes(word)) {
        return primary;
      }
    }
    return word;
  });
  
  // Process compound words
  const processedWords: string[] = [];
  const skipIndices = new Set<number>();
  
  // Check for compound words
  for (let i = 0; i < words.length; i++) {
    if (skipIndices.has(i)) continue;
    
    let foundCompound = false;
    for (const compound of COMPOUND_WORDS) {
      if (i + compound.length <= words.length) {
        const slice = words.slice(i, i + compound.length);
        if (compound.every((word, j) => word === slice[j])) {
          processedWords.push(compound.join('_'));
          for (let j = i; j < i + compound.length; j++) {
            skipIndices.add(j);
          }
          foundCompound = true;
          break;
        }
      }
    }
    
    if (!foundCompound && !skipIndices.has(i)) {
      processedWords.push(words[i]);
    }
  }
  
  // Sort processed words while keeping compound words intact
  return processedWords.sort().join(' ');
}

/**
 * Check if a phrase is a duplicate based on enhanced normalization
 */
export function isDuplicatePhrase(
  phrase: Pick<Phrase, 'english'>, 
  existingPhrases: Array<Pick<Phrase, 'english'>>
): boolean {
  const normalizedNew = normalizeEnglish(phrase.english);
  
  return existingPhrases.some(existing => 
    normalizeEnglish(existing.english) === normalizedNew
  );
}

/**
 * Deduplicate phrases and ensure proper capitalization
 */
export function dedupeAndCapitalizePhrases(phrases: Phrase[]): Phrase[] {
  const seen = new Set<string>();
  const result: Phrase[] = [];
  
  for (const phrase of phrases) {
    // Normalize for deduplication
    const normEnglish = phrase.english.trim().toLowerCase();
    if (!seen.has(normEnglish)) {
      seen.add(normEnglish);
      // Capitalize English field (first letter upper, rest as-is)
      phrase.english = phrase.english.trim().charAt(0).toUpperCase() + phrase.english.trim().slice(1);
      result.push(phrase);
    }
  }
  
  return result;
}

/**
 * Check if Thai text contains common particles or patterns that might indicate duplicates
 */
export function hasThaiDuplicatePatterns(thai1: string, thai2: string): boolean {
  // Remove Thai particles for comparison
  let normalized1 = thai1;
  let normalized2 = thai2;
  
  for (const particle of THAI_PARTICLES) {
    normalized1 = normalized1.replace(new RegExp(particle, 'g'), '');
    normalized2 = normalized2.replace(new RegExp(particle, 'g'), '');
  }
  
  // Remove spaces for comparison
  normalized1 = normalized1.replace(/\s+/g, '');
  normalized2 = normalized2.replace(/\s+/g, '');
  
  return normalized1 === normalized2;
}

/**
 * Validate a batch of phrases
 */
export function validateBatch(phrases: unknown[]): { 
  valid: Phrase[], 
  invalid: unknown[] 
} {
  const valid: Phrase[] = [];
  const invalid: unknown[] = [];
  
  for (const phrase of phrases) {
    if (isValidPhrase(phrase)) {
      valid.push(phrase);
    } else {
      invalid.push(phrase);
    }
  }
  
  return { valid, invalid };
}

/**
 * Clean and sanitize phrase text
 */
export function sanitizePhrase(phrase: Phrase): Phrase {
  return {
    ...phrase,
    english: phrase.english.trim(),
    thai: phrase.thai.trim(),
    thaiMasculine: phrase.thaiMasculine.trim(),
    thaiFeminine: phrase.thaiFeminine.trim(),
    pronunciation: phrase.pronunciation.trim(),
    mnemonic: phrase.mnemonic?.trim(),
    examples: phrase.examples.map(ex => ({
      thai: ex.thai.trim(),
      thaiMasculine: ex.thaiMasculine.trim(),
      thaiFeminine: ex.thaiFeminine.trim(),
      pronunciation: ex.pronunciation.trim(),
      translation: ex.translation.trim()
    }))
  };
} 