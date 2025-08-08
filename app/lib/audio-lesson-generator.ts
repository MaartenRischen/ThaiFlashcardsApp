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
  includePolitenessParticles: false, // Default to NOT including politeness particles
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
  private ttsCache: Map<string, ArrayBuffer> = new Map();

  constructor(config: Partial<AudioLessonConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.azureTTS = new AzureTTSAudio();
    
    // Debug logging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔧 PIMSLEUR AUDIO GENERATOR CONSTRUCTOR');
      console.log('🔧 Input config:', JSON.stringify(config, null, 2));
      console.log('🔧 DEFAULT_CONFIG:', JSON.stringify(DEFAULT_CONFIG, null, 2));
      console.log('🔧 Final merged config:', JSON.stringify(this.config, null, 2));
      console.log('🔧 Politeness particles setting:', this.config.includePolitenessParticles);
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
    
    console.log('🔧 GET_THAI_TEXT CALLED WITH:', {
      thai: card.thai,
      thaiMasculine: card.thaiMasculine,
      thaiFeminine: card.thaiFeminine
    });
    
    // First get the appropriate text based on gender
    if (this.config.voiceGender === 'male' && card.thaiMasculine) {
      thaiText = card.thaiMasculine;
      console.log('🔧 Selected thaiMasculine:', thaiText);
    } else if (this.config.voiceGender === 'female' && card.thaiFeminine) {
      thaiText = card.thaiFeminine;
      console.log('🔧 Selected thaiFeminine:', thaiText);
    } else {
      thaiText = card.thai;
      console.log('🔧 Selected base thai:', thaiText);
    }
    
    // Debug logging
    console.log('🔧 GET_THAI_TEXT DEBUG START');
    console.log('🔧 Input text:', thaiText);
    console.log('🔧 Config includePolitenessParticles:', this.config.includePolitenessParticles);
    
    // FIRST: Strip any existing politeness particles - MORE COMPREHENSIVE REGEX
    const beforeStrip = thaiText;
    // Match krub/krap/ka in various forms, including Thai script
    thaiText = thaiText.replace(/(\s*(krap|krub|khrap|khrub|ka|kha|ครับ|คร้าบ|คร๊าบ|คับ|ค่ะ|คะ|ค้า|ค๊ะ))$/gi, '');
    if (beforeStrip !== thaiText) {
      console.log('🔧 Stripped existing particles:', beforeStrip, '->', thaiText);
    }
    
    // Handle politeness particles based on configuration
    if (this.config.includePolitenessParticles === false) {
      console.log('🔧 POLITENESS PARTICLES DISABLED - returning text without particles:', thaiText);
    } else {
      console.log('🔧 POLITENESS PARTICLES ENABLED - checking if we need to add');
      // Don't add particles to questions or certain phrases
      const isQuestion = /(\s*(ไหม|มั้ย|หรือ|อะไร|ทำไม|อย่างไร|ที่ไหน|เหรอ|หรือเปล่า|รึเปล่า))$/i.test(thaiText);
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
    
    console.log('🔧 FINAL THAI TEXT FOR TTS:', thaiText);
    console.log('🔧 GET_THAI_TEXT DEBUG END');
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
    if (process.env.NODE_ENV !== 'production') console.log('Starting audio lesson generation for:', setName);
    this.audioSegments = [];

    try {
      if (process.env.NODE_ENV !== 'production') console.log('Creating introduction...');
      // 1. Introduction
      await this.addSegment({
        type: 'instruction',
        text: `Welcome to your Thai language lesson: ${setName}. Listen carefully and repeat during the pauses.`,
        voice: 'english'
      });

      await this.addSilence(2000);

      if (process.env.NODE_ENV !== 'production') console.log('Creating introduction phase...');
      // 2. Introduction phase - present each phrase
      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        if (process.env.NODE_ENV !== 'production') console.log(`Introducing phrase ${i + 1}/${flashcards.length}`);
        await this.introducePhrase(card, i + 1);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(this.config.pauseDurationMs.betweenPhrases);
        }
      }

      await this.addSilence(3000);

      if (process.env.NODE_ENV !== 'production') console.log('Creating practice phase...');
      // 3. Practice phase - active recall
      await this.addSegment({
        type: 'instruction',
        text: "Now let's practice. Listen to the English and try to say it in Thai before you hear the answer.",
        voice: 'english'
      });

      await this.addSilence(2000);

      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        if (process.env.NODE_ENV !== 'production') console.log(`Practice session ${i + 1}/${flashcards.length}`);
        await this.practicePhrase(card, i + 1);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(this.config.pauseDurationMs.betweenPhrases);
        }
      }

      await this.addSilence(3000);

      if (process.env.NODE_ENV !== 'production') console.log('Creating review phase...');
      // 4. Review phase - quick repetitions
      await this.addSegment({
        type: 'instruction',
        text: "Finally, let's review all phrases quickly.",
        voice: 'english'
      });

      await this.addSilence(2000);

      for (let i = 0; i < flashcards.length; i++) {
        const card = flashcards[i];
        if (process.env.NODE_ENV !== 'production') console.log(`Reviewing phrase ${i + 1}/${flashcards.length}`);
        await this.reviewPhrase(card);
        
        if (i < flashcards.length - 1) {
          await this.addSilence(1000);
        }
      }

      // 5. Conclusion
      if (process.env.NODE_ENV !== 'production') console.log('Creating conclusion...');
      await this.addSilence(2000);
      await this.addSegment({
        type: 'instruction',
        text: "Great job! You've completed the lesson. Keep practicing!",
        voice: 'english'
      });

      // Combine all audio segments - NO PROGRESS TRACKING
      if (process.env.NODE_ENV !== 'production') console.log('Combining audio segments...');
      return AudioCombiner.combineWavBuffers(this.audioSegments);

    } catch (error) {
      console.error('Error generating audio lesson:', error);
      throw error;
    }
  }

  // Add instruction text and wait
  private async addSegment(segment: LessonSegment): Promise<void> {
    if (segment.type === 'instruction' && segment.text) {
      const audioBuffer = await this.getAudio(segment.text, 'english');
      this.audioSegments.push(audioBuffer);
      
      if (segment.voice !== 'thai') {
        await this.addSilence(this.config.pauseDurationMs.afterInstruction);
      }
    } else if (segment.type === 'thai' && segment.text) {
      const audioBuffer = await this.getAudio(segment.text, 'thai');
      this.audioSegments.push(audioBuffer);
    } else if (segment.type === 'english' && segment.text) {
      const audioBuffer = await this.getAudio(segment.text, 'english');
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
      await this.addSegment({ type: 'english', text: card.english });
      
      await this.addSilence(300);
      
      await this.addSegment({ type: 'thai', text: thaiText });
      
      if (i < this.config.repetitions.review - 1) {
        await this.addSilence(800);
      }
    }
  }

  private async getAudio(text: string, language: 'thai' | 'english'): Promise<ArrayBuffer> {
    const key = `${language}|${this.config.voiceGender}|1.0|${text}`;
    const cached = this.ttsCache.get(key);
    if (cached) return cached;
    const buffer = await this.azureTTS.synthesizeToBuffer(text, language, this.config.voiceGender, 1.0);
    this.ttsCache.set(key, buffer);
    return buffer;
  }
} 