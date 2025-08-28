/**
 * Validates that a mnemonic phonetically matches the pronunciation
 */

export interface MnemonicValidationResult {
  isValid: boolean;
  issues: string[];
  suggestions?: string[];
}

/**
 * Extracts the phonetic sound from a mnemonic (usually in quotes)
 */
function extractMnemonicSound(mnemonic: string): string | null {
  const match = mnemonic.match(/['"]([^'"]+)['"]/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Checks if a mnemonic contains phonetic elements from the pronunciation
 */
export function validateMnemonic(
  pronunciation: string,
  mnemonic: string,
  english?: string
): MnemonicValidationResult {
  const result: MnemonicValidationResult = {
    isValid: true,
    issues: []
  };

  // Extract phonetic sound from mnemonic
  const mnemonicSound = extractMnemonicSound(mnemonic);
  if (!mnemonicSound) {
    result.isValid = false;
    result.issues.push('Mnemonic should contain a phonetic sound in quotes');
    return result;
  }

  // Clean pronunciation for comparison
  const cleanPronunciation = pronunciation
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '') // Remove tone marks
    .replace(/[^a-z\s-]/g, ''); // Keep only letters, spaces, and hyphens

  // Split into syllables
  const pronunciationSyllables = cleanPronunciation.split(/[\s-]+/).filter(s => s.length > 0);
  const mnemonicWords = mnemonicSound.split(/[\s-]+/).filter(w => w.length > 0);

  // Check for any syllable match
  let hasMatch = false;
  const matchedSyllables: string[] = [];

  for (const syllable of pronunciationSyllables) {
    if (syllable.length < 2) continue; // Skip very short syllables
    
    for (const word of mnemonicWords) {
      // Direct substring match
      if (word.includes(syllable) || syllable.includes(word)) {
        hasMatch = true;
        matchedSyllables.push(syllable);
        break;
      }
      
      // Consonant cluster match (e.g., 'kr' in 'krap' matches 'cr' in 'crap')
      const syllableConsonants = syllable.replace(/[aeiou]/g, '');
      const wordConsonants = word.replace(/[aeiou]/g, '');
      
      if (syllableConsonants.length > 1 && wordConsonants.length > 1) {
        if (syllableConsonants === wordConsonants || 
            wordConsonants.includes(syllableConsonants) ||
            syllableConsonants.includes(wordConsonants)) {
          hasMatch = true;
          matchedSyllables.push(syllable);
          break;
        }
      }
    }
  }

  if (!hasMatch) {
    result.isValid = false;
    result.issues.push(`Mnemonic "${mnemonicSound}" doesn't phonetically match pronunciation "${pronunciation}"`);
    
    // Generate suggestions
    result.suggestions = generateMnemonicSuggestions(pronunciationSyllables, english);
  }

  // Check for common bad patterns
  if (pronunciation.includes('kɔ̌ɔ bin') && mnemonicSound.includes('check bin')) {
    result.isValid = false;
    result.issues.push('Critical: Mnemonic appears to be for a different Thai phrase');
  }

  return result;
}

/**
 * Generate mnemonic suggestions based on pronunciation
 */
function generateMnemonicSuggestions(syllables: string[], english?: string): string[] {
  const suggestions: string[] = [];
  
  // Try to create phonetic matches for each syllable
  const syllableMatches: { [key: string]: string[] } = {
    'kaw': ['cow', 'caw', 'call'],
    'bin': ['bin', 'bean', 'been'],
    'noi': ['noy', 'boy', 'annoy'],
    'chai': ['chai', 'try', 'shy'],
    'mai': ['my', 'may', 'mine'],
    'khun': ['kun', 'coon', 'june'],
    'phom': ['pom', 'palm', 'bomb'],
    'chan': ['chan', 'john', 'shawn'],
    // Add more as needed
  };

  // Build a suggestion from syllable matches
  const matchedWords = syllables
    .map(s => syllableMatches[s]?.[0] || s)
    .join(' ');

  if (english) {
    suggestions.push(`Think: '${matchedWords}' - ${english.toLowerCase()}`);
  } else {
    suggestions.push(`Think: '${matchedWords}'`);
  }

  return suggestions;
}

/**
 * Validate all phrases in a set
 */
export function validatePhraseSet(phrases: Array<{
  pronunciation: string;
  mnemonic: string;
  english: string;
  thai: string;
}>): Array<{
  phrase: string;
  issues: MnemonicValidationResult;
}> {
  const problems: Array<{
    phrase: string;
    issues: MnemonicValidationResult;
  }> = [];

  for (const phrase of phrases) {
    const validation = validateMnemonic(phrase.pronunciation, phrase.mnemonic, phrase.english);
    if (!validation.isValid) {
      problems.push({
        phrase: `${phrase.english} (${phrase.thai})`,
        issues: validation
      });
    }
  }

  return problems;
}
