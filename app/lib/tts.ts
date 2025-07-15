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
  _isContext: boolean = false, 
  isMale: boolean = true,
  _options: SpeakOptions = {}
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