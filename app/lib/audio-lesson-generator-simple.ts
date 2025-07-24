import { AzureTTSAudio } from './azure-tts-audio';
import { AudioCombiner } from './audio-combiner';

// Simple audio lesson configuration
export interface SimpleAudioLessonConfig {
  voiceGender: 'male' | 'female';
  repetitions: number; // How many times to repeat each phrase
  pauseBetweenRepetitions: number; // ms between repetitions
  pauseBetweenPhrases: number; // ms between different phrases
  loops: number; // How many times to loop through all phrases
  includeMnemonics?: boolean; // Whether to include mnemonics in the audio
}

const DEFAULT_CONFIG: SimpleAudioLessonConfig = {
  voiceGender: 'female',
  repetitions: 3,
  pauseBetweenRepetitions: 1000,
  pauseBetweenPhrases: 2000,
  loops: 3,
  includeMnemonics: false,
};

export class SimpleAudioLessonGenerator {
  private config: SimpleAudioLessonConfig;
  private audioSegments: ArrayBuffer[] = [];
  private azureTTS: AzureTTSAudio;

  constructor(config: Partial<SimpleAudioLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
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
  ): Promise<ArrayBuffer> {
    console.log('Starting simple audio lesson generation for:', setName);
    this.audioSegments = [];

    try {
      // Simple intro
      const introText = `${setName}. Listen and repeat.`;
      const introAudio = await this.azureTTS.synthesizeToBuffer(
        introText,
        'english',
        this.config.voiceGender
      );
      this.audioSegments.push(introAudio);
      this.audioSegments.push(this.azureTTS.createSilence(2000));

      // Main loop - repeat the entire set multiple times
      for (let loop = 0; loop < this.config.loops; loop++) {
        console.log(`Loop ${loop + 1} of ${this.config.loops}`);
        
        for (let i = 0; i < flashcards.length; i++) {
          const card = flashcards[i];
          
          // Get the appropriate Thai text based on gender
          const thaiText = this.getThaiText(card);
          
          // New pattern: English meaning -> Thai translation -> (optional mnemonic) -> English/Thai repetitions
          
          // 1. English meaning
          const englishAudio = await this.azureTTS.synthesizeToBuffer(
            card.english,
            'english',
            this.config.voiceGender
          );
          this.audioSegments.push(englishAudio);
          
          // 2. Thai translation (no pause)
          const thaiAudio = await this.azureTTS.synthesizeToBuffer(
            thaiText,
            'thai',
            this.config.voiceGender
          );
          this.audioSegments.push(thaiAudio);
          
          // 3. Optional mnemonic (no pause)
          if (this.config.includeMnemonics && card.mnemonic) {
            const mnemonicAudio = await this.azureTTS.synthesizeToBuffer(
              card.mnemonic,
              'english',
              this.config.voiceGender
            );
            this.audioSegments.push(mnemonicAudio);
          }
          
          // 4. Repetition pattern: English -> Thai -> English -> Thai (no pauses)
          // First repetition: English
          this.audioSegments.push(englishAudio);
          
          // First repetition: Thai
          this.audioSegments.push(thaiAudio);
          
          // Second repetition: English
          this.audioSegments.push(englishAudio);
          
          // Second repetition: Thai
          this.audioSegments.push(thaiAudio);
          
          // Pause between different phrases
          if (i < flashcards.length - 1) {
            this.audioSegments.push(
              this.azureTTS.createSilence(this.config.pauseBetweenPhrases)
            );
          }
        }
        
        // Pause between loops (longer)
        if (loop < this.config.loops - 1) {
          this.audioSegments.push(this.azureTTS.createSilence(3000));
        }
      }

      // Simple outro
      const outroText = "Good job. Sweet dreams.";
      const outroAudio = await this.azureTTS.synthesizeToBuffer(
        outroText,
        'english',
        this.config.voiceGender
      );
      this.audioSegments.push(this.azureTTS.createSilence(1000));
      this.audioSegments.push(outroAudio);

      // Combine all segments
      return AudioCombiner.combineWavBuffers(this.audioSegments);

    } catch (error) {
      console.error('Error generating simple audio lesson:', error);
      throw error;
    }
  }

  /**
   * Get appropriate Thai text based on gender setting
   */
  private getThaiText(card: { 
    thai: string; 
    thaiMasculine?: string; 
    thaiFeminine?: string 
  }): string {
    if (this.config.voiceGender === 'male' && card.thaiMasculine) {
      return card.thaiMasculine;
    } else if (this.config.voiceGender === 'female' && card.thaiFeminine) {
      return card.thaiFeminine;
    }
    return card.thai;
  }
} 