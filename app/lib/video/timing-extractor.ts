import { AudioTiming } from './types';

interface TimingConfig {
  pauseBetweenPhrases: number;
  speed: number;
  loops: number;
  phraseRepetitions: number;
  includeMnemonics: boolean;
  mixSpeed?: boolean;
}

interface GuidedTimingConfig {
  pauseDurationMs: {
    afterInstruction: number;
    forPractice: number;
    betweenPhrases: number;
    beforeAnswer: number;
  };
  repetitions: {
    introduction: number;
    practice: number;
    review: number;
  };
  includeMnemonics: boolean;
  speed?: number;
}

export class VideoTimingExtractor {
  private timings: AudioTiming[] = [];
  private currentTime: number = 0;
  
  constructor(private config: TimingConfig | GuidedTimingConfig) {}
  
  /**
   * Extract timing data for simple repetitive lesson
   */
  extractSimpleLessonTimings(phraseCount: number): AudioTiming[] {
    this.timings = [];
    this.currentTime = 0;
    
    const config = this.config as TimingConfig;
    const baseSpeed = config.speed || 1.0;
    const speedVariations = [0.8, 1.0, 1.2, 0.9, 1.1];
    
    // Main loops
    for (let loop = 0; loop < config.loops; loop++) {
      for (let i = 0; i < phraseCount; i++) {
        // Initial presentation: English -> Thai -> (optional mnemonic)
        
        // 1. English meaning
        const englishDuration = this.estimateDuration('english', baseSpeed);
        this.addTiming(i, 'english', englishDuration);
        
        // 2. Thai translation
        const thaiDuration = this.estimateDuration('thai', baseSpeed);
        this.addTiming(i, 'thai', thaiDuration);
        
        // 3. Optional mnemonic
        if (config.includeMnemonics) {
          const mnemonicDuration = this.estimateDuration('mnemonic', baseSpeed);
          this.addTiming(i, 'mnemonic', mnemonicDuration);
        }
        
        // 4. Repetition pattern
        const repetitions = config.phraseRepetitions || 2;
        
        for (let rep = 0; rep < repetitions; rep++) {
          let currentSpeed = baseSpeed;
          if (config.mixSpeed) {
            currentSpeed = baseSpeed * speedVariations[rep % speedVariations.length];
          }
          
          // Pattern: English -> Thai -> Thai -> Thai -> English -> Thai
          
          // English
          this.addTiming(i, 'english', this.estimateDuration('english', currentSpeed), true, rep);
          
          // Thai (3 times)
          for (let j = 0; j < 3; j++) {
            this.addTiming(i, 'thai', this.estimateDuration('thai', currentSpeed), true, rep);
          }
          
          // English again
          this.addTiming(i, 'english', this.estimateDuration('english', currentSpeed), true, rep);
          
          // Thai (final)
          this.addTiming(i, 'thai', this.estimateDuration('thai', currentSpeed), true, rep);
        }
        
        // Pause between phrases
        if (i < phraseCount - 1) {
          this.addPause(config.pauseBetweenPhrases);
        }
      }
      
      // Pause between loops
      if (loop < config.loops - 1) {
        this.addPause(3000);
      }
    }
    
    // Outro
    const outroDuration = this.estimateDuration('english', 1.0) * 1.5;
    this.addPause(1000);
    this.currentTime += outroDuration; // "Good job. Sweet dreams."
    
    return this.timings;
  }
  
  /**
   * Extract timing data for guided (Pimsleur-style) lesson
   */
  extractGuidedLessonTimings(phraseCount: number): AudioTiming[] {
    this.timings = [];
    this.currentTime = 0;
    
    const config = this.config as GuidedTimingConfig;
    const baseSpeed = config.speed || 1.0;
    
    // Introduction
    this.addInstruction(
      'Welcome to your Thai language lesson. Listen carefully and repeat during the pauses.',
      baseSpeed
    );
    this.addPause(config.pauseDurationMs.afterInstruction);
    
    // Introduction phase
    for (let i = 0; i < phraseCount; i++) {
      // "Phrase X"
      this.addInstruction(`Phrase ${i + 1}`, baseSpeed);
      
      // English
      this.addTiming(i, 'english', this.estimateDuration('english', baseSpeed));
      this.addPause(500);
      
      // Thai (2 times)
      for (let j = 0; j < config.repetitions.introduction; j++) {
        this.addTiming(i, 'thai', this.estimateDuration('thai', 0.8));
        if (j === 0) this.addPause(1000);
      }
      
      // Optional mnemonic
      if (config.includeMnemonics) {
        this.addTiming(i, 'mnemonic', this.estimateDuration('mnemonic', baseSpeed));
      }
      
      if (i < phraseCount - 1) {
        this.addPause(config.pauseDurationMs.betweenPhrases);
      }
    }
    
    this.addPause(3000);
    
    // Practice phase
    this.addInstruction(
      'Now let\'s practice. Listen to the English and try to say it in Thai before you hear the answer.',
      baseSpeed
    );
    this.addPause(config.pauseDurationMs.afterInstruction);
    
    for (let i = 0; i < phraseCount; i++) {
      // English prompt
      this.addTiming(i, 'english', this.estimateDuration('english', baseSpeed));
      
      // Pause for user response
      this.addPause(config.pauseDurationMs.forPractice);
      
      // Thai answer (2 times)
      for (let j = 0; j < config.repetitions.practice; j++) {
        this.addTiming(i, 'thai', this.estimateDuration('thai', 0.8), true);
        if (j === 0) this.addPause(1000);
      }
      
      if (i < phraseCount - 1) {
        this.addPause(config.pauseDurationMs.betweenPhrases);
      }
    }
    
    this.addPause(3000);
    
    // Review phase
    this.addInstruction(
      'Finally, let\'s review all phrases quickly.',
      baseSpeed
    );
    this.addPause(config.pauseDurationMs.afterInstruction);
    
    for (let i = 0; i < phraseCount; i++) {
      // Quick English -> Thai
      this.addTiming(i, 'english', this.estimateDuration('english', 1.2));
      this.addPause(200);
      this.addTiming(i, 'thai', this.estimateDuration('thai', 1.2));
      
      if (i < phraseCount - 1) {
        this.addPause(1000);
      }
    }
    
    // Conclusion
    this.addPause(2000);
    this.addInstruction('Great job! You\'ve completed the lesson.', baseSpeed);
    
    return this.timings;
  }
  
  private addInstruction(text: string, speed: number): void {
    const duration = (text.length / 15) * 1000 / speed; // Rough estimate: 15 chars per second
    this.addTiming(-1, 'english', duration, false, undefined, text);
  }
  
  private addTiming(
    phraseIndex: number,
    type: 'english' | 'thai' | 'mnemonic',
    duration: number,
    isActive: boolean = false,
    repetition?: number,
    instructionText?: string
  ): void {
    const startTime = this.currentTime;
    const endTime = startTime + duration;
    
    this.timings.push({
      phraseIndex,
      type,
      startTime: startTime / 1000, // Convert to seconds
      endTime: endTime / 1000,
      isActive,
      repetition,
      instructionText
    });
    
    this.currentTime = endTime;
  }
  
  private addPause(duration: number): void {
    const startTime = this.currentTime;
    const endTime = startTime + duration;
    
    this.timings.push({
      phraseIndex: -1,
      type: 'pause',
      startTime: startTime / 1000,
      endTime: endTime / 1000
    });
    
    this.currentTime = endTime;
  }
  
  /**
   * Estimate duration based on type and speed
   * These are rough estimates - actual duration depends on TTS
   */
  private estimateDuration(type: string, speed: number): number {
    const baseDurations = {
      english: 2000,  // 2 seconds average
      thai: 2200,     // 2.2 seconds average
      mnemonic: 3000  // 3 seconds average
    };
    
    const duration = baseDurations[type as keyof typeof baseDurations] || 2000;
    return duration / speed;
  }
  
  /**
   * Get total estimated duration
   */
  getTotalDuration(): number {
    if (this.timings.length === 0) return 0;
    return Math.max(...this.timings.map(t => t.endTime));
  }
}