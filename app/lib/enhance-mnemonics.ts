/**
 * Post-process generated phrases to enhance mnemonics using the breakdown approach
 */

import { generateMnemonic } from './gemini';
import { isInvalidMnemonic } from './mnemonic-breakdown';
import type { Phrase } from './types';

/**
 * Enhance mnemonics for an array of phrases
 * Checks each mnemonic and regenerates if it's invalid (just repeating pronunciation)
 */
export async function enhanceMnemonics(phrases: Phrase[]): Promise<Phrase[]> {
  console.log(`Enhancing mnemonics for ${phrases.length} phrases...`);
  
  const enhancedPhrases = await Promise.all(
    phrases.map(async (phrase) => {
      // Skip if no mnemonic or missing required fields
      if (!phrase.mnemonic || !phrase.pronunciation || !phrase.english || !phrase.thai) {
        return phrase;
      }
      
      // Check if the mnemonic needs enhancement
      if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
        console.log(`Enhancing mnemonic for: "${phrase.english}"`);
        
        try {
          // Generate enhanced mnemonic with breakdown support
          const enhancedMnemonic = await generateMnemonic(
            phrase.thai,
            phrase.english,
            phrase.pronunciation
          );
          
          return {
            ...phrase,
            mnemonic: enhancedMnemonic
          };
        } catch (error) {
          console.error(`Failed to enhance mnemonic for "${phrase.english}":`, error);
          // Keep original mnemonic if enhancement fails
          return phrase;
        }
      }
      
      // Mnemonic is already good
      return phrase;
    })
  );
  
  // Log enhancement results
  const enhancedCount = enhancedPhrases.filter((p, i) => 
    p.mnemonic !== phrases[i].mnemonic
  ).length;
  
  console.log(`Enhanced ${enhancedCount} out of ${phrases.length} mnemonics`);
  
  return enhancedPhrases;
}

/**
 * Check if a phrase is complex enough to warrant mnemonic breakdown
 */
export function isComplexPhrase(phrase: Phrase): boolean {
  const wordCount = phrase.english.split(' ').length;
  const thaiLength = phrase.thai.length;
  const pronunciationWords = phrase.pronunciation.split(/[\s\-]+/).length;
  
  return wordCount > 8 || thaiLength > 30 || pronunciationWords > 10;
}
