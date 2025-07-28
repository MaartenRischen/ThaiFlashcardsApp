import { AzureTTSAudio } from './azure-tts-audio';
import { AudioCombiner } from './audio-combiner';

// Progress callback type
export type ProgressCallback = (progress: number, message: string) => void;

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
  includePolitenessParticles: true, // Default to including politeness particles
};

export class SimpleAudioLessonGenerator {
  private config: SimpleAudioLessonConfig;
  private audioSegments: ArrayBuffer[] = [];
  private azureTTS: AzureTTSAudio;
  private progressCallback?: ProgressCallback;

  constructor(config: Partial<SimpleAudioLessonConfig> = {}, progressCallback?: ProgressCallback) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
    this.progressCallback = progressCallback;
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

    // Calculate total operations for progress tracking
    const totalLoops = this.config.loops;
    const phrasesPerLoop = flashcards.length;
    const repetitionsPerPhrase = (this.config.phraseRepetitions || 2);
    const segmentsPerPhrase = 2 + (this.config.includeMnemonics ? 1 : 0) + (repetitionsPerPhrase * 6); // English + Thai + optional mnemonic + repetitions
    const totalSegments = (totalLoops * phrasesPerLoop * segmentsPerPhrase) + 2; // +2 for outro
    let currentSegment = 0;

    const updateProgress = (message: string) => {
      const progress = Math.min(85, (currentSegment / totalSegments) * 85); // Reserve 15% for combining
      this.progressCallback?.(progress, message);
    };

    try {
      updateProgress('Initializing audio generation...');

      // Main loop - repeat the entire set multiple times
      for (let loop = 0; loop < this.config.loops; loop++) {
        console.log(`Loop ${loop + 1} of ${this.config.loops}`);
        updateProgress(`Processing loop ${loop + 1} of ${this.config.loops}...`);
        
        for (let i = 0; i < flashcards.length; i++) {
          const card = flashcards[i];
          updateProgress(`Generating audio for phrase ${i + 1}/${flashcards.length} (loop ${loop + 1})...`);
          
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
          currentSegment++;
          
          // 2. Thai translation (no pause)
          const thaiAudio = await this.azureTTS.synthesizeToBuffer(
            thaiText,
            'thai',
            this.config.voiceGender,
            baseSpeed
          );
          this.audioSegments.push(thaiAudio);
          currentSegment++;
          
          // 3. Optional mnemonic (no pause)
          if (this.config.includeMnemonics && card.mnemonic) {
            const mnemonicAudio = await this.azureTTS.synthesizeToBuffer(
              card.mnemonic,
              'english',
              this.config.voiceGender,
              baseSpeed
            );
            this.audioSegments.push(mnemonicAudio);
            currentSegment++;
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
            currentSegment++;
            
            // 2. Thai (first)
            const thaiRepAudio1 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio1);
            currentSegment++;
            
            // 3. Thai (second)
            const thaiRepAudio2 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio2);
            currentSegment++;
            
            // 4. Thai (third)
            const thaiRepAudio3 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio3);
            currentSegment++;
            
            // 5. English (again)
            const englishRepAudio2 = await this.azureTTS.synthesizeToBuffer(
              card.english,
              'english',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(englishRepAudio2);
            currentSegment++;
            
            // 6. Thai (fourth)
            const thaiRepAudio4 = await this.azureTTS.synthesizeToBuffer(
              thaiText,
              'thai',
              this.config.voiceGender,
              currentSpeed
            );
            this.audioSegments.push(thaiRepAudio4);
            currentSegment++;
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

      updateProgress('Generating outro...');
      // Simple outro
      const outroText = "Good job. Sweet dreams.";
      const outroAudio = await this.azureTTS.synthesizeToBuffer(
        outroText,
        'english',
        this.config.voiceGender
      );
      this.audioSegments.push(this.azureTTS.createSilence(1000));
      this.audioSegments.push(outroAudio);
      currentSegment += 2;

      // Combine all segments with progress tracking
      updateProgress('Combining audio segments...');
      return AudioCombiner.combineWavBuffersWithProgress(this.audioSegments, (combineProgress) => {
        const totalProgress = 85 + (combineProgress * 15); // Combining takes final 15%
        this.progressCallback?.(totalProgress, 'Rendering final audio...');
      });

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
    console.log('getThaiText Debug:', {
      originalText: thaiText,
      includePolitenessParticles: this.config.includePolitenessParticles,
      voiceGender: this.config.voiceGender
    });
    
    // Handle politeness particles
    if (this.config.includePolitenessParticles === false) {
      // Remove politeness particles if disabled
      const beforeRemoval = thaiText;
      thaiText = thaiText.replace(/( krap| krub| ka| ค่ะ| ครับ)$/i, '');
      console.log('Politeness particles DISABLED - removed from:', beforeRemoval, 'to:', thaiText);
    } else {
      console.log('Politeness particles ENABLED - checking if we need to add...');
      // Add politeness particle if not present and configuration allows it (default behavior)
      const hasPoliteParticle = /( krap| krub| ka| ค่ะ| ครับ)$/i.test(thaiText);
      
      if (!hasPoliteParticle) {
        // Don't add particles to questions or certain phrases
        const isQuestion = /( ไหม| มั้ย| หรือ| อะไร| ทำไม| อย่างไร| ที่ไหน)$/i.test(thaiText);
        
        if (!isQuestion) {
          // Add appropriate politeness particle
          const particle = this.config.voiceGender === 'female' ? ' ka' : ' krap';
          thaiText += particle;
          console.log('Added politeness particle:', particle, 'to:', thaiText);
        } else {
          console.log('Skipped adding particle to question:', thaiText);
        }
      } else {
        console.log('Already has politeness particle:', thaiText);
      }
    }
    
    console.log('Final Thai text:', thaiText);
    return thaiText;
  }
} 