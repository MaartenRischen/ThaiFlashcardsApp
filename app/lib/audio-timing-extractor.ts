import { AudioTiming } from './video-lesson-generator';

interface TimingConfig {
  pauseBetweenPhrases: number;
  speed: number;
  loops: number;
  phraseRepetitions: number;
  includeMnemonics: boolean;
  mixSpeed?: boolean;
}

export class AudioTimingExtractor {
  private timings: AudioTiming[] = [];
  private currentTime: number = 0;
  
  constructor(private config: TimingConfig) {}
  
  /**
   * Extract timing data for simple audio lesson (Omelette du Fromage style)
   */
  extractSimpleLessonTimings(phraseCount: number): AudioTiming[] {
    this.timings = [];
    this.currentTime = 0;
    
    const baseSpeed = this.config.speed || 1.0;
    const speedVariations = [0.8, 1.0, 1.2, 0.9, 1.1];
    
    // Main loops
    for (let loop = 0; loop < this.config.loops; loop++) {
      for (let i = 0; i < phraseCount; i++) {
        // Initial presentation: English -> Thai -> (optional mnemonic)
        
        // 1. English meaning
        const englishDuration = this.estimateDuration('english', baseSpeed);
        this.addTiming(i, 'english', englishDuration);
        
        // 2. Thai translation
        const thaiDuration = this.estimateDuration('thai', baseSpeed);
        this.addTiming(i, 'thai', thaiDuration);
        
        // 3. Optional mnemonic
        if (this.config.includeMnemonics) {
          const mnemonicDuration = this.estimateDuration('mnemonic', baseSpeed);
          this.addTiming(i, 'mnemonic', mnemonicDuration);
        }
        
        // 4. Repetition pattern
        const repetitions = this.config.phraseRepetitions || 2;
        
        for (let rep = 0; rep < repetitions; rep++) {
          let currentSpeed = baseSpeed;
          if (this.config.mixSpeed) {
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
          this.addPause(this.config.pauseBetweenPhrases);
        }
      }
      
      // Pause between loops
      if (loop < this.config.loops - 1) {
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
   * Extract timing data for structured audio lesson
   */
  extractStructuredLessonTimings(phraseCount: number): AudioTiming[] {
    this.timings = [];
    this.currentTime = 0;
    
    // Introduction
    this.currentTime += 5000; // Welcome message
    this.addPause(2000);
    
    // Introduction phase
    for (let i = 0; i < phraseCount; i++) {
      // "Phrase X"
      this.currentTime += 1500;
      
      // English
      this.addTiming(i, 'english', this.estimateDuration('english', 1.0));
      this.addPause(500);
      
      // Thai (2 times)
      for (let j = 0; j < 2; j++) {
        this.addTiming(i, 'thai', this.estimateDuration('thai', 0.8));
        if (j === 0) this.addPause(1000);
      }
      
      if (i < phraseCount - 1) {
        this.addPause(this.config.pauseBetweenPhrases);
      }
    }
    
    this.addPause(3000);
    
    // Practice phase
    this.currentTime += 4000; // Instruction
    this.addPause(2000);
    
    for (let i = 0; i < phraseCount; i++) {
      // English prompt
      this.addTiming(i, 'english', this.estimateDuration('english', 1.0));
      
      // Pause for user response
      this.addPause(3000);
      
      // Thai answer (2 times)
      for (let j = 0; j < 2; j++) {
        this.addTiming(i, 'thai', this.estimateDuration('thai', 0.8), true);
        if (j === 0) this.addPause(1000);
      }
      
      if (i < phraseCount - 1) {
        this.addPause(this.config.pauseBetweenPhrases);
      }
    }
    
    this.addPause(3000);
    
    // Review phase
    this.currentTime += 3000; // Instruction
    this.addPause(2000);
    
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
    this.currentTime += 3000; // "Great job!"
    
    return this.timings;
  }
  
  private addTiming(
    phraseIndex: number,
    type: 'english' | 'thai' | 'mnemonic',
    duration: number,
    isActive: boolean = false,
    repetition?: number
  ): void {
    const startTime = this.currentTime;
    const endTime = startTime + duration;
    
    this.timings.push({
      phraseIndex,
      type,
      startTime: startTime / 1000, // Convert to seconds
      endTime: endTime / 1000,
      isActive,
      repetition
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