import { AzureTTSAudio } from './azure-tts-audio';
import { AudioCombiner } from './audio-combiner';

// Audio lesson configuration
export interface AudioLessonConfig {
  voiceGender: 'male' | 'female';
  englishVoice?: string; // Default: en-US voices
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
  includePolitenessParticles?: boolean; // Whether to include politeness particles (ka/krub)
}

const DEFAULT_CONFIG: AudioLessonConfig = {
  voiceGender: 'female',
  pauseDurationMs: {
    afterInstruction: 1000,
    forPractice: 3000,
    betweenPhrases: 1500,
    beforeAnswer: 2000,
  },
  repetitions: {
    introduction: 2,
    practice: 3,
    review: 2,
  },
  includePolitenessParticles: true, // Default to including politeness particles
};

// Lesson segment types
interface LessonSegment {
  type: 'instruction' | 'thai' | 'english' | 'silence';
  text?: string;
  durationMs?: number;
  voice?: 'thai' | 'english';
}

export class AudioLessonGenerator {
  private config: AudioLessonConfig;
  private audioSegments: ArrayBuffer[] = [];
  private sampleRate = 16000; // Azure TTS default
  private azureTTS: AzureTTSAudio;

  constructor(config: Partial<AudioLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
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
    
    // Handle politeness particles
    if (this.config.includePolitenessParticles === false) {
      // Remove politeness particles if disabled
      thaiText = thaiText.replace(/( krap| krub| ka| ค่ะ| ครับ)$/i, '');
    } else {
      // Add politeness particle if not present and configuration allows it (default behavior)
      const hasPoliteParticle = /( krap| krub| ka| ค่ะ| ครับ)$/i.test(thaiText);
      
      if (!hasPoliteParticle) {
        // Don't add particles to questions or certain phrases
        const isQuestion = /( ไหม| มั้ย| หรือ| อะไร| ทำไม| อย่างไร| ที่ไหน)$/i.test(thaiText);
        
        if (!isQuestion) {
          // Add appropriate politeness particle
          const particle = this.config.voiceGender === 'female' ? ' ka' : ' krap';
          thaiText += particle;
        }
      }
    }
    
    return thaiText;
  }

  // Generate a complete audio lesson for a flashcard set
  async generateLesson(
    flashcards: Array<{
      thai: string;
      english: string;
      thaiMasculine?: string;
      thaiFeminine?: string;
    }>,
    setName: string
  ): Promise<ArrayBuffer> {
    console.log('Starting audio lesson generation for:', setName);
    this.audioSegments = [];

    try {
      // 1. Introduction
      await this.addSegment({
        type: 'instruction',
        text: `Welcome to your Thai language lesson: ${setName}. Listen carefully and repeat during the pauses.`,
        voice: 'english'
      });

      await this.addSilence(2000);

      // 2. Introduction phase - present each phrase
      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        await this.introducePhrase(card, i + 1);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(this.config.pauseDurationMs.betweenPhrases);
        }
      }

      await this.addSilence(3000);

      // 3. Practice phase - active recall
      await this.addSegment({
        type: 'instruction',
        text: "Now let's practice. Listen to the English and try to say it in Thai before you hear the answer.",
        voice: 'english'
      });

      await this.addSilence(2000);

      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        await this.practicePhrase(card, i + 1);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(this.config.pauseDurationMs.betweenPhrases);
        }
      }

      await this.addSilence(3000);

      // 4. Review phase - quick repetitions
      await this.addSegment({
        type: 'instruction',
        text: "Finally, let's review all phrases quickly.",
        voice: 'english'
      });

      await this.addSilence(2000);

      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        await this.reviewPhrase(card);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(1000);
        }
      }

      // 5. Conclusion
      await this.addSilence(2000);
      await this.addSegment({
        type: 'instruction',
        text: "Great job! You've completed the lesson. Keep practicing!",
        voice: 'english'
      });

      // Combine all audio segments
      return AudioCombiner.combineWavBuffers(this.audioSegments);

    } catch (error) {
      console.error('Error generating audio lesson:', error);
      throw error;
    }
  }

  // Add instruction text and wait
  private async addSegment(segment: LessonSegment): Promise<void> {
    if (segment.type === 'instruction' && segment.text) {
      const audioBuffer = await this.azureTTS.synthesizeToBuffer(
        segment.text,
        'english',
        this.config.voiceGender
      );
      this.audioSegments.push(audioBuffer);
      
      if (segment.voice !== 'thai') {
        await this.addSilence(this.config.pauseDurationMs.afterInstruction);
      }
    } else if (segment.type === 'thai' && segment.text) {
      const audioBuffer = await this.azureTTS.synthesizeToBuffer(
        segment.text,
        'thai',
        this.config.voiceGender
      );
      this.audioSegments.push(audioBuffer);
    } else if (segment.type === 'english' && segment.text) {
      const audioBuffer = await this.azureTTS.synthesizeToBuffer(
        segment.text,
        'english',
        this.config.voiceGender
      );
      this.audioSegments.push(audioBuffer);
    }
  }

  // Add silence buffer
  private async addSilence(durationMs: number): Promise<void> {
    const silenceBuffer = this.azureTTS.createSilence(durationMs);
    this.audioSegments.push(silenceBuffer);
  }

  // Introduction phase: Present phrase multiple times
  private async introducePhrase(card: {
    thai: string;
    english: string;
    thaiMasculine?: string;
    thaiFeminine?: string;
  }, phraseNumber: number): Promise<void> {
    
    const thaiText = this.getThaiText(card);
    
    await this.addSegment({
      type: 'instruction',
      text: `Phrase ${phraseNumber}.`,
      voice: 'english'
    });

    // Repeat the phrase introduction according to config
    for (let i = 0; i < this.config.repetitions.introduction; i++) {
      await this.addSegment({
        type: 'english',
        text: card.english
      });
      
      await this.addSilence(500);
      
      await this.addSegment({
        type: 'thai',
        text: thaiText
      });
      
      if (i < this.config.repetitions.introduction - 1) {
        await this.addSilence(1000);
      }
    }
  }

  // Practice phase: English -> pause -> Thai
  private async practicePhrase(card: {
    thai: string;
    english: string;
    thaiMasculine?: string;
    thaiFeminine?: string;
  }, phraseNumber: number): Promise<void> {
    
    const thaiText = this.getThaiText(card);
    
    await this.addSegment({
      type: 'instruction',
      text: `Practice ${phraseNumber}.`,
      voice: 'english'
    });

    // Practice repetitions
    for (let i = 0; i < this.config.repetitions.practice; i++) {
      await this.addSegment({
        type: 'english',
        text: card.english
      });
      
      // Practice pause - user tries to say it
      await this.addSilence(this.config.pauseDurationMs.forPractice);
      
      // Answer pause
      await this.addSilence(this.config.pauseDurationMs.beforeAnswer);
      
      await this.addSegment({
        type: 'thai',
        text: thaiText
      });
      
      if (i < this.config.repetitions.practice - 1) {
        await this.addSilence(1500);
      }
    }
  }

  // Review phase: Quick repetitions
  private async reviewPhrase(card: {
    thai: string;
    english: string;
    thaiMasculine?: string;
    thaiFeminine?: string;
  }): Promise<void> {
    
    const thaiText = this.getThaiText(card);
    
    for (let i = 0; i < this.config.repetitions.review; i++) {
      await this.addSegment({
        type: 'english',
        text: card.english
      });
      
      await this.addSilence(300);
      
      await this.addSegment({
        type: 'thai',
        text: thaiText
      });
      
      if (i < this.config.repetitions.review - 1) {
        await this.addSilence(800);
      }
    }
  }
} 