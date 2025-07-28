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

  constructor(config: Partial<SimpleAudioLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
    
    // Debug logging
    console.log('🔧 SIMPLE AUDIO GENERATOR CONSTRUCTOR');
    console.log('🔧 Input config:', JSON.stringify(config, null, 2));
    console.log('🔧 DEFAULT_CONFIG:', JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log('🔧 Final merged config:', JSON.stringify(this.config, null, 2));
    console.log('🔧 Politeness particles setting:', this.config.includePolitenessParticles);
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
    console.log('Config:', this.config);
    console.log('Speed setting:', this.config.speed);
    this.audioSegments = [];

    try {
      // Main loop - repeat the entire set multiple times
      for (let loop = 0; loop < this.config.loops; loop++) {
        console.log(`Loop ${loop + 1} of ${this.config.loops}`);
        
        for (let i = 0; i < flashcards.length; i++) {
          const card = flashcards[i];
          console.log(`Generating audio for phrase ${i + 1}/${flashcards.length} (loop ${loop + 1})`);
          
          // Get the appropriate Thai text based on gender
          const thaiText = this.getThaiText(card);
          
          // New pattern: English meaning -> Thai translation -> (optional mnemonic) -> English/Thai repetitions
          
          // Get speed for initial parts (always normal speed for first occurrence)
          const baseSpeed = this.config.speed || 1.0;
          console.log('Using base speed:', baseSpeed);
          
          // 1. English meaning
          const englishAudio = await this.azureTTS.synthesizeToBuffer(
            card.english,
            'english',
            this.config.voiceGender,
            baseSpeed
          );
          this.audioSegments.push(englishAudio);
          
          // 2. Thai translation (no pause)
          const thaiAudio = await this.azureTTS.synthesizeToBuffer(
            thaiText,
            'thai',
            this.config.voiceGender,
            baseSpeed
          );
          this.audioSegments.push(thaiAudio);
          
          // 3. Optional mnemonic (no pause)
          if (this.config.includeMnemonics && card.mnemonic) {
            const mnemonicAudio = await this.azureTTS.synthesizeToBuffer(
              card.mnemonic,
              'english',
              this.config.voiceGender,
              baseSpeed
            );
            this.audioSegments.push(mnemonicAudio);
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
            const englishRepAudio = await this.azureTTS.synthesizeToBuffer(
              card.english,
              'english',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(englishRepAudio);
            
            // 2. Thai (first)
            const thaiRepAudio1 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio1);
            
            // 3. Thai (second)
            const thaiRepAudio2 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio2);
            
            // 4. Thai (third)
            const thaiRepAudio3 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio3);
            
            // 5. English (again)
            const englishRepAudio2 = await this.azureTTS.synthesizeToBuffer(
              card.english,
              'english',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(englishRepAudio2);
            
            // 6. Thai (fourth)
            const thaiRepAudio4 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio4);
          }
          
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

      // Combine all segments - NO PROGRESS TRACKING
      console.log('Combining audio segments...');
      return AudioCombiner.combineWavBuffers(this.audioSegments);

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
    
    // First get the appropriate text based on gender
    if (this.config.voiceGender === 'male' && card.thaiMasculine) {
      thaiText = card.thaiMasculine;
    } else if (this.config.voiceGender === 'female' && card.thaiFeminine) {
      thaiText = card.thaiFeminine;
    } else {
      thaiText = card.thai;
    }
    
    // Debug logging
    console.log('🔧 GET_THAI_TEXT DEBUG START');
    console.log('🔧 Input text:', thaiText);
    
    // FIRST: Strip any existing politeness particles
    const beforeStrip = thaiText;
    thaiText = thaiText.replace(/( krap| krub| ka| ค่ะ| ครับ)$/i, '');
    if (beforeStrip !== thaiText) {
      console.log('🔧 Stripped existing particles:', beforeStrip, '->', thaiText);
    }
    
    // Handle politeness particles based on configuration
    if (this.config.includePolitenessParticles === false) {
      console.log('🔧 POLITENESS PARTICLES DISABLED - keeping text without particles:', thaiText);
    } else {
      console.log('🔧 POLITENESS PARTICLES ENABLED - checking if we need to add');
      // Don't add particles to questions or certain phrases
      const isQuestion = /( ไหม| มั้ย| หรือ| อะไร| ทำไม| อย่างไร| ที่ไหน)$/i.test(thaiText);
      console.log('🔧 Is question:', isQuestion);
      
      if (!isQuestion) {
        // Add appropriate politeness particle
        const particle = this.config.voiceGender === 'female' ? ' ka' : ' krap';
        console.log('🔧 Adding particle:', particle);
        thaiText += particle;
        console.log('🔧 Text after adding particle:', thaiText);
      } else {
        console.log('🔧 Skipping particle addition for question');
      }
    }
    
    console.log('🔧 FINAL THAI TEXT:', thaiText);
    console.log('🔧 GET_THAI_TEXT DEBUG END');
    return thaiText;
  }
} 