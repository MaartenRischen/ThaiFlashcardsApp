/**
 * Text-to-speech utility for speaking Thai phrases
 */

import { ttsService } from './tts-service';

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

/**
 * Speaks the provided text using Azure TTS with browser fallback
 * @param text - The text to speak
 * @param isContext - Whether this is a context example (longer phrase)
 * @param isMale - Whether to use a male voice if available
 * @param options - Additional speech synthesis options (used only for browser fallback)
 * @returns Promise that resolves when speech is complete or rejects on error
 */
export async function speak(
  text: string, 
  isContext: boolean = false, 
  isMale: boolean = true,
  options: SpeakOptions = {}
): Promise<void> {
  // Simply delegate to ttsService which handles Azure + fallback
  return ttsService.speak({
    text,
    genderValue: isMale,
    onStart: () => console.log('Speech started'),
    onEnd: () => console.log('Speech ended'),
    onError: (error) => console.error('Speech error:', error)
  });
}

/**
 * Browser TTS implementation
 */
function speakWithBrowser(
  text: string,
  isContext: boolean,
  isMale: boolean,
  options: SpeakOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    try {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set default options
      utterance.rate = options.rate ?? (isContext ? 0.8 : 1.0);
      utterance.pitch = options.pitch ?? 1.0;
      utterance.volume = options.volume ?? 1.0;
      
      // Try to select an appropriate voice
      if (options.voice) {
        utterance.voice = options.voice;
      } else {
        // Get all voices and find a Thai voice if available
        const voices = window.speechSynthesis.getVoices();
        const thaiVoices = voices.filter(voice => voice.lang === 'th-TH');
        
        if (thaiVoices.length > 0) {
          // If there are gender-specific voices, try to use the appropriate one
          const genderVoices = thaiVoices.filter(voice => {
            const isFemaleName = voice.name.toLowerCase().includes('female');
            const isMaleName = voice.name.toLowerCase().includes('male');
            return isMale ? isMaleName : isFemaleName;
          });
          
          utterance.voice = genderVoices.length > 0 ? genderVoices[0] : thaiVoices[0];
        }
      }
      
      // Apply pitch adjustment for male voices (browser TTS)
      if (isMale) {
        utterance.pitch = 0.25; // Two octaves lower
        utterance.rate = 0.95;
      }
      
      // Events
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      
      // Speak
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error using speech synthesis:', error);
      reject(error);
    }
  });
}

/**
 * Gets available Thai voices for speech synthesis
 * @returns Array of available Thai voices
 */
export function getThaiVoices(): SpeechSynthesisVoice[] {
  if (!window.speechSynthesis) return [];
  
  const voices = window.speechSynthesis.getVoices();
  return voices.filter(voice => voice.lang === 'th-TH');
} 