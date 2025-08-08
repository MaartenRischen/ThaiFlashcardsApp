import { AzureTTSAudio } from './azure-tts-audio';
import { AudioCombiner } from './audio-combiner';
import type { AudioTiming } from '@/app/lib/video-lesson-generator';

// Simple audio lesson configuration
export interface SimpleAudioLessonConfig {
  voiceGender: 'male' | 'female';
  repetitions: number; // How many times to repeat each phrase
  pauseBetweenRepetitions: number; // ms between repetitions
  pauseBetweenPhrases: number; // ms between different phrases
  loops: number; // How many times to loop through all phrases
  includeMnemonics?: boolean; // Whether to include mnemonics in the audio
  phraseRepetitions?: number; // How many times to repeat the English->Thai pattern
  speed?: number; // Speed of audio (0.5 = half speed, 1 = normal, 2 = double speed)
  mixSpeed?: boolean; // Whether to vary speed for each repetition
  includePolitenessParticles?: boolean; // Whether to include politeness particles (ka/krub)
}

const DEFAULT_CONFIG: SimpleAudioLessonConfig = {
  voiceGender: 'female',
  repetitions: 3,
  pauseBetweenRepetitions: 1000,
  pauseBetweenPhrases: 2000,
  loops: 3,
  includeMnemonics: false,
  phraseRepetitions: 2, // Default to 2 repetitions of English->Thai
  speed: 1.0, // Normal speed
  mixSpeed: false,
  includePolitenessParticles: false, // Default to NOT including politeness particles
};

export class SimpleAudioLessonGenerator {
  private config: SimpleAudioLessonConfig;
  private audioSegments: ArrayBuffer[] = [];
  private azureTTS: AzureTTSAudio;
  private ttsCache: Map<string, ArrayBuffer> = new Map();
  private timings: AudioTiming[] = [];
  private currentTimeSec = 0;

  constructor(config: Partial<SimpleAudioLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 SIMPLE AUDIO GENERATOR CONSTRUCTOR');
      console.log('🔧 Input config:', JSON.stringify(config, null, 2));
      console.log('🔧 DEFAULT_CONFIG:', JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('🔧 Final merged config:', JSON.stringify(this.config, null, 2));
      console.log('🔧 Politeness particles setting:', this.config.includePolitenessParticles);
    }
  }

  /**
   * Generate a simple repetitive audio lesson (Omelette du Fromage style)
   */
  async generateSimpleLesson(
    flashcards: Array<{
      thai: string;
      english: string;
      thaiMasculine?: string;
      thaiFeminine?: string;
      mnemonic?: string;
    }>,
    setName: string
  ): Promise<{ audioBuffer: ArrayBuffer; timings: AudioTiming[] }> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Starting simple audio lesson generation for:', setName);
      console.log('Config:', this.config);
      console.log('Speed setting:', this.config.speed);
    }
    this.audioSegments = [];
    this.timings = [];
    this.currentTimeSec = 0;

    try {
      // Main loop - repeat the entire set multiple times
      for (let loop = 0; loop < this.config.loops; loop++) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`Loop ${loop + 1} of ${this.config.loops}`);
        }
        
        for (let i = 0; i < flashcards.length; i++) {
          const card = flashcards[i];
          if (process.env.NODE_ENV !== 'production') {
            console.log(`Generating audio for phrase ${i + 1}/${flashcards.length} (loop ${loop + 1})`);
          }
          
          // Get the appropriate Thai text based on gender
          const thaiText = this.getThaiText(card);
          
          // New pattern: English meaning -> Thai translation -> (optional mnemonic) -> English/Thai repetitions
          
          // Get speed for initial parts (always normal speed for first occurrence)
          const baseSpeed = this.config.speed || 1.0;
          if (process.env.NODE_ENV !== 'production') {
            console.log('Using base speed:', baseSpeed);
          }
          
          // 1. English meaning
          const englishAudio = await this.getAudio(card.english, 'english', this.config.voiceGender, baseSpeed);
          this.audioSegments.push(englishAudio);
          this.addTiming(i, 'english', englishAudio);
          
          // 2. Thai translation (no pause)
          const thaiAudio = await this.getAudio(thaiText, 'thai', this.config.voiceGender, baseSpeed);
          this.audioSegments.push(thaiAudio);
          this.addTiming(i, 'thai', thaiAudio);
          
          // 3. Optional mnemonic (no pause)
          if (this.config.includeMnemonics && card.mnemonic) {
            const mnemonicAudio = await this.getAudio(card.mnemonic, 'english', this.config.voiceGender, baseSpeed);
            this.audioSegments.push(mnemonicAudio);
            this.addTiming(i, 'mnemonic', mnemonicAudio);
          }
          
          // 4. Repetition pattern: English -> Thai -> Thai -> Thai -> English -> Thai
          const repetitions = this.config.phraseRepetitions || 2;
          const speedVariations = [0.8, 1.0, 1.2, 0.9, 1.1]; // Speed variations for mix mode
          
          for (let rep = 0; rep < repetitions; rep++) {
            // Calculate speed for this repetition
            let currentSpeed = baseSpeed;
            if (this.config.mixSpeed) {
              // Use different speeds for each repetition
              currentSpeed = baseSpeed * speedVariations[rep % speedVariations.length];
            }
            
            // Pattern: English -> Thai -> Thai -> Thai -> English -> Thai
            
            // 1. English
            const englishRepAudio = await this.getAudio(card.english, 'english', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(englishRepAudio);
            this.addTiming(i, 'english', englishRepAudio, true, rep);
            
            // 2. Thai (first)
            const thaiRepAudio1 = await this.getAudio(thaiText, 'thai', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(thaiRepAudio1);
            this.addTiming(i, 'thai', thaiRepAudio1, true, rep);
            
            // 3. Thai (second)
            const thaiRepAudio2 = await this.getAudio(thaiText, 'thai', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(thaiRepAudio2);
            this.addTiming(i, 'thai', thaiRepAudio2, true, rep);
            
            // 4. Thai (third)
            const thaiRepAudio3 = await this.getAudio(thaiText, 'thai', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(thaiRepAudio3);
            this.addTiming(i, 'thai', thaiRepAudio3, true, rep);
            
            // 5. English (again)
            const englishRepAudio2 = await this.getAudio(card.english, 'english', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(englishRepAudio2);
            this.addTiming(i, 'english', englishRepAudio2, true, rep);
            
            // 6. Thai (fourth)
            const thaiRepAudio4 = await this.getAudio(thaiText, 'thai', this.config.voiceGender, currentSpeed);
            this.audioSegments.push(thaiRepAudio4);
            this.addTiming(i, 'thai', thaiRepAudio4, true, rep);
          }
          
          // Pause between different phrases
          if (i < flashcards.length - 1) {
            const silence = this.azureTTS.createSilence(this.config.pauseBetweenPhrases);
            this.audioSegments.push(silence);
            this.addPause(this.config.pauseBetweenPhrases);
          }
        }
        
        // Pause between loops (longer)
        if (loop < this.config.loops - 1) {
          const silence = this.azureTTS.createSilence(3000);
          this.audioSegments.push(silence);
          this.addPause(3000);
        }
      }

      // Simple outro
      const outroText = "Good job. Sweet dreams.";
      const outroAudio = await this.azureTTS.synthesizeToBuffer(
        outroText,
        'english',
        this.config.voiceGender
      );
      const preOutroSilence = this.azureTTS.createSilence(1000);
      this.audioSegments.push(preOutroSilence);
      this.addPause(1000);
      this.audioSegments.push(outroAudio);
      this.addTiming(flashcards.length - 1, 'english', outroAudio);

      // Combine all segments - NO PROGRESS TRACKING
      if (process.env.NODE_ENV !== 'production') {
        console.log('Combining audio segments...');
      }
      const audioBuffer = AudioCombiner.combineWavBuffers(this.audioSegments);
      return { audioBuffer, timings: this.timings };

    } catch (error) {
      console.error('Error generating simple audio lesson:', error);
      throw error;
    }
  }

  /**
   * Get appropriate Thai text based on gender setting and politeness particle configuration
   */
  private getThaiText(card: { 
    thai: string; 
    thaiMasculine?: string; 
    thaiFeminine?: string 
  }): string {
    let thaiText: string;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 GET_THAI_TEXT CALLED WITH:', {
        thai: card.thai,
        thaiMasculine: card.thaiMasculine,
        thaiFeminine: card.thaiFeminine
      });
    }
    
    // First get the appropriate text based on gender
    if (this.config.voiceGender === 'male' && card.thaiMasculine) {
      thaiText = card.thaiMasculine;
      if (process.env.NODE_ENV !== 'production') console.log('🔧 Selected thaiMasculine:', thaiText);
    } else if (this.config.voiceGender === 'female' && card.thaiFeminine) {
      thaiText = card.thaiFeminine;
      if (process.env.NODE_ENV !== 'production') console.log('🔧 Selected thaiFeminine:', thaiText);
    } else {
      thaiText = card.thai;
      if (process.env.NODE_ENV !== 'production') console.log('🔧 Selected base thai:', thaiText);
    }
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 GET_THAI_TEXT DEBUG START');
      console.log('🔧 Input text:', thaiText);
      console.log('🔧 Config includePolitenessParticles:', this.config.includePolitenessParticles);
    }
    
    // FIRST: Strip any existing politeness particles - MORE COMPREHENSIVE REGEX
    const beforeStrip = thaiText;
    // Match krub/krap/ka in various forms, including Thai script
    thaiText = thaiText.replace(/(\s*(krap|krub|khrap|khrub|ka|kha|ครับ|คร้าบ|คร๊าบ|คับ|ค่ะ|คะ|ค้า|ค๊ะ))$/gi, '');
    if (beforeStrip !== thaiText) {
      if (process.env.NODE_ENV !== 'production') console.log('🔧 Stripped existing particles:', beforeStrip, '->', thaiText);
    }
    
    // Handle politeness particles based on configuration
    if (this.config.includePolitenessParticles === false) {
      if (process.env.NODE_ENV !== 'production') console.log('🔧 POLITENESS PARTICLES DISABLED - returning text without particles:', thaiText);
    } else {
      if (process.env.NODE_ENV !== 'production') console.log('🔧 POLITENESS PARTICLES ENABLED - checking if we need to add');
      // Don't add particles to questions or certain phrases
      const isQuestion = /(\s*(ไหม|มั้ย|หรือ|อะไร|ทำไม|อย่างไร|ที่ไหน|เหรอ|หรือเปล่า|รึเปล่า))$/i.test(thaiText);
      if (process.env.NODE_ENV !== 'production') console.log('🔧 Is question:', isQuestion);
      
      if (!isQuestion) {
        // Add appropriate politeness particle
        const particle = this.config.voiceGender === 'female' ? ' ka' : ' krap';
        if (process.env.NODE_ENV !== 'production') console.log('🔧 Adding particle:', particle);
        thaiText += particle;
        if (process.env.NODE_ENV !== 'production') console.log('🔧 Text after adding particle:', thaiText);
      } else {
        if (process.env.NODE_ENV !== 'production') console.log('🔧 Skipping particle addition for question');
      }
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 FINAL THAI TEXT FOR TTS:', thaiText);
      console.log('🔧 GET_THAI_TEXT DEBUG END');
    }
    return thaiText;
  }

  private async getAudio(
    text: string,
    language: 'thai' | 'english',
    voiceGender: 'male' | 'female',
    speed: number
  ): Promise<ArrayBuffer> {
    const key = `${language}|${voiceGender}|${speed}|${text}`;
    const cached = this.ttsCache.get(key);
    if (cached) return cached;
    const buffer = await this.azureTTS.synthesizeToBuffer(text, language, voiceGender, speed);
    this.ttsCache.set(key, buffer);
    return buffer;
  }

  private addTiming(
    phraseIndex: number,
    type: 'english' | 'thai' | 'mnemonic',
    buffer: ArrayBuffer,
    isActive: boolean = false,
    repetition?: number
  ): void {
    const durationSec = this.getDurationSeconds(buffer);
    const start = this.currentTimeSec;
    const end = start + durationSec;
    this.timings.push({ phraseIndex, type, startTime: start, endTime: end, isActive, repetition });
    this.currentTimeSec = end;
  }

  private addPause(durationMs: number): void {
    const start = this.currentTimeSec;
    const end = start + durationMs / 1000;
    this.timings.push({ phraseIndex: -1, type: 'pause', startTime: start, endTime: end });
    this.currentTimeSec = end;
  }

  private getDurationSeconds(buffer: ArrayBuffer): number {
    // 16kHz, 16-bit mono
    const sampleRate = 16000;
    if (buffer.byteLength <= 44) return 0;
    const view = new DataView(buffer);
    const isWav =
      buffer.byteLength > 44 && view.getUint32(0, false) === 0x52494646 && view.getUint32(8, false) === 0x57415645;
    const pcmBytes = isWav ? buffer.byteLength - 44 : buffer.byteLength;
    const samples = pcmBytes / 2; // 16-bit
    return samples / sampleRate;
  }
} 