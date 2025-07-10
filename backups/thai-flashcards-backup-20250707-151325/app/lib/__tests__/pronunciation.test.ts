import { describe, it, expect } from 'vitest';
import { 
  getThaiWithGender, 
  getGenderedPronunciation, 
  extractPronunciationAndMnemonic,
  type Phrase 
} from '../pronunciation';

describe('Pronunciation Utility Tests', () => {
  describe('getThaiWithGender', () => {
    const testPhrase: Phrase = {
      thai: 'สวัสดี',
      english: 'Hello',
      pronunciation: 'sawadee',
      translation: 'Hello',
    };
    
    const questionPhrase: Phrase = {
      thai: 'คุณชื่ออะไร',
      english: 'What is your name?',
      pronunciation: 'khun cheu arai',
      translation: 'What is your name?',
    };
    
    it('should return base thai when polite mode is off', () => {
      expect(getThaiWithGender(testPhrase, true, false)).toBe('สวัสดี');
      expect(getThaiWithGender(testPhrase, false, false)).toBe('สวัสดี');
    });
    
    it('should add male ending in polite mode', () => {
      expect(getThaiWithGender(testPhrase, true, true)).toBe('สวัสดีครับ');
    });
    
    it('should add female ending in polite mode', () => {
      expect(getThaiWithGender(testPhrase, false, true)).toBe('สวัสดีค่ะ');
    });
    
    it('should not add ending to phrases that already end with special particles', () => {
      expect(getThaiWithGender(questionPhrase, true, true)).toBe('คุณชื่ออะไร');
      expect(getThaiWithGender(questionPhrase, false, true)).toBe('คุณชื่ออะไร');
    });
    
    it('should handle null phrase gracefully', () => {
      expect(getThaiWithGender(null, true, true)).toBe('');
    });
  });
  
  describe('getGenderedPronunciation', () => {
    const testPhrase: Phrase = {
      thai: 'สวัสดี',
      english: 'Hello',
      pronunciation: 'sawadee',
      translation: 'Hello',
    };
    
    const pronounPhrase: Phrase = {
      thai: 'ฉัน/ผม',
      english: 'I',
      pronunciation: 'chan/phom',
      translation: 'I',
    };
    
    const questionPhrase: Phrase = {
      thai: 'คุณชื่ออะไร',
      english: 'What is your name?',
      pronunciation: 'khun cheu arai',
      translation: 'What is your name?',
    };
    
    it('should return base pronunciation when polite mode is off', () => {
      expect(getGenderedPronunciation(testPhrase, true, false)).toBe('sawadee');
      expect(getGenderedPronunciation(testPhrase, false, false)).toBe('sawadee');
    });
    
    it('should add male ending in polite mode', () => {
      expect(getGenderedPronunciation(testPhrase, true, true)).toBe('sawadee krap');
    });
    
    it('should add female ending in polite mode', () => {
      expect(getGenderedPronunciation(testPhrase, false, true)).toBe('sawadee ka');
    });
    
    it('should replace chan/phom with male pronoun when male is selected', () => {
      expect(getGenderedPronunciation(pronounPhrase, true, false)).toBe('phom');
    });
    
    it('should replace chan/phom with female pronoun when female is selected', () => {
      expect(getGenderedPronunciation(pronounPhrase, false, false)).toBe('chan');
    });
    
    it('should not add ending to pronunciations that end with polite particles', () => {
      const phraseWithEnding: Phrase = {
        thai: 'สวัสดี',
        english: 'Hello',
        pronunciation: 'sawadee krap',
        translation: 'Hello',
      };
      
      expect(getGenderedPronunciation(phraseWithEnding, true, true)).toBe('sawadee krap');
    });
    
    it('should not add ending to phrases that already end with special particles', () => {
      expect(getGenderedPronunciation(questionPhrase, true, true)).toBe('khun cheu arai');
    });
    
    it('should handle null phrase gracefully', () => {
      expect(getGenderedPronunciation(null, true, true)).toBe('');
    });
  });
  
  describe('extractPronunciationAndMnemonic', () => {
    it('should extract pronunciation and mnemonic when formatted with "Pronunciation:" label', () => {
      const text = 'Pronunciation: sa-wat-dee\n\nRemember "sawadee" sounds like "saw a bee"';
      const result = extractPronunciationAndMnemonic(text);
      expect(result.pronunciation).toBe('sa-wat-dee');
      expect(result.mnemonic).toBe('Remember "sawadee" sounds like "saw a bee"');
    });
    
    it('should handle text with multiple paragraphs', () => {
      const text = 'Pronunciation: mai pen rai\n\nThis means "no problem"\n\nUsed when someone apologizes or when something is not important';
      const result = extractPronunciationAndMnemonic(text);
      expect(result.pronunciation).toBe('mai pen rai');
      expect(result.mnemonic).toBe('This means "no problem"\n\nUsed when someone apologizes or when something is not important');
    });
    
    it('should handle text with just pronunciation delimiter', () => {
      const text = 'sawadee\n\nRemember by thinking of "saw a bee"';
      const result = extractPronunciationAndMnemonic(text);
      expect(result.pronunciation).toBe('sawadee');
      expect(result.mnemonic).toBe('Remember by thinking of "saw a bee"');
    });
    
    it('should handle text with no clear pronunciation section', () => {
      const text = 'Think of "my pen, right!" for "mai pen rai"';
      const result = extractPronunciationAndMnemonic(text);
      expect(result.pronunciation).toBe('');
      expect(result.mnemonic).toBe('Think of "my pen, right!" for "mai pen rai"');
    });
    
    it('should handle empty text', () => {
      const result = extractPronunciationAndMnemonic('');
      expect(result.pronunciation).toBe('');
      expect(result.mnemonic).toBe('');
    });
  });
}); 