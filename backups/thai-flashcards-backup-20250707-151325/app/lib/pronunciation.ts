/**
 * Utilities for handling Thai pronunciation and gendered particles
 */

export interface ExampleSentence {
  thai: string;
  translation: string;
  pronunciation: string;
}

export interface Phrase extends ExampleSentence {
  id?: number;
  english: string;
  examples: ExampleSentence[]; // REQUIRED: Must have at least 2 example sentences
  mnemonic?: string;
}

/**
 * Gets the Thai text with the appropriate gendered ending if in polite mode
 */
export function getThaiWithGender(phrase: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string {
  if (!phrase) return '';
  // ALWAYS start with the absolute base Thai
  const baseThai = phrase.thai; 

  // If Polite Mode is OFF, return the absolute base
  if (!isPoliteMode) {
    return baseThai;
  }

  // Polite Mode is ON: Check endings and add particle if appropriate
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'ครับ', 'ค่ะ'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThai.endsWith(ending));

  if (!endsWithPoliteEnding) {
    return isMale ? `${baseThai}ครับ` : `${baseThai}ค่ะ`;
  }
  
  // If Polite Mode is ON but ending is unsuitable, return the base
  return baseThai; 
}

/**
 * Gets the pronunciation with gendered pronouns and endings
 */
export function getGenderedPronunciation(phraseData: Phrase | ExampleSentence | null, isMale: boolean, isPoliteMode: boolean): string {
  if (!phraseData) return '';
  let basePronunciation = phraseData.pronunciation;
  const baseThaiForEndingCheck = phraseData.thai; // Check ending on BASE Thai

  // Step 1: Handle gendered pronouns in pronunciation
  if (basePronunciation.includes('chan/phom')) basePronunciation = basePronunciation.replace('chan/phom', isMale ? 'phom' : 'chan');
  else if (basePronunciation.includes('phom/chan')) basePronunciation = basePronunciation.replace('phom/chan', isMale ? 'phom' : 'chan');

  // Step 2: Check Polite Mode for adding particles
  if (!isPoliteMode) {
    return basePronunciation; // Return pronoun-adjusted if mode is off
  }

  // Polite Mode ON: Check endings on BASE Thai and add particle if appropriate
  const politeEndingsToAvoid = ['ไหม', 'อะไร', 'ไหน', 'เท่าไหร่', 'เหรอ', 'หรือ', 'ใช่ไหม', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'ที่ไหน', 'ครับ', 'ค่ะ'];
  const endsWithPoliteEnding = politeEndingsToAvoid.some(ending => baseThaiForEndingCheck.endsWith(ending));

  if (!endsWithPoliteEnding) {
    const endsWithKrapKa = basePronunciation.endsWith(' krap') || basePronunciation.endsWith(' ka');
    if (!endsWithKrapKa) return basePronunciation + (isMale ? " krap" : " ka");
  }
  
  // If Polite Mode is ON but ending is unsuitable, return pronoun-adjusted base
  return basePronunciation; 
}

/**
 * Extract pronunciation and mnemonic from a text
 * @param text Text containing both pronunciation and mnemonic
 * @returns Object with separated pronunciation and mnemonic
 */
export function extractPronunciationAndMnemonic(text: string): { pronunciation: string, mnemonic: string } {
  // Simple case - no pronunciation section
  if (!text.includes('Pronunciation:')) {
    // Check if there's a double newline separator
    const parts = text.split(/\n\n+/);
    if (parts.length >= 2) {
      return {
        pronunciation: parts[0].trim(),
        mnemonic: parts.slice(1).join('\n\n').trim()
      };
    }
    
    return { pronunciation: '', mnemonic: text.trim() };
  }
  
  // Extract pronunciation if it's in an expected format
  const match = text.match(/Pronunciation:\s*([^\n]+)(?:\n|$)/);
  if (match && match[1]) {
    const pronunciation = match[1].trim();
    const mnemonic = text.replace(match[0], '').trim();
    return { pronunciation, mnemonic };
  }
  
  // Fallback - return original text as mnemonic
  return { pronunciation: '', mnemonic: text.trim() };
} 