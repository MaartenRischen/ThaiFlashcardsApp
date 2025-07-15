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

      // 4. Review phase - spaced repetition
      await this.addSilence(3000);
      await this.addSegment({
        type: 'instruction',
        text: "Excellent work! Let's review what you've learned.",
        voice: 'english'
      });

      await this.addSilence(2000);

      // Shuffle for review
      const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
      for (const card of shuffled.slice(0, Math.min(5, shuffled.length))) {
        await this.reviewPhrase(card);
        await this.addSilence(this.config.pauseDurationMs.betweenPhrases);
      }

      // 5. Closing
      await this.addSegment({
        type: 'instruction',
        text: "Great job! Practice these phrases throughout your day. See you next time!",
        voice: 'english'
      });

      // Combine all segments into final audio
      return this.combineSegments();

    } catch (error) {
      console.error('Error generating audio lesson:', error);
      throw error;
    }
  }

  // Introduce a new phrase
  private async introducePhrase(
    card: { thai: string; english: string; thaiMasculine?: string; thaiFeminine?: string },
    number: number
  ) {
    // Introduction
    await this.addSegment({
      type: 'instruction',
      text: `Phrase ${number}: ${card.english}`,
      voice: 'english'
    });

    await this.addSilence(this.config.pauseDurationMs.afterInstruction);

    // Thai phrase (repeated)
    const thaiText = this.getThaiText(card);
    for (let i = 0; i < this.config.repetitions.introduction; i++) {
      await this.addSegment({
        type: 'thai',
        text: thaiText,
        voice: 'thai'
      });

      if (i < this.config.repetitions.introduction - 1) {
        await this.addSilence(1000);
      }
    }

    await this.addSilence(this.config.pauseDurationMs.afterInstruction);

    // Instruction to repeat
    await this.addSegment({
      type: 'instruction',
      text: "Now repeat:",
      voice: 'english'
    });

    await this.addSilence(this.config.pauseDurationMs.forPractice);
  }

  // Practice phase with active recall
  private async practicePhrase(
    card: { thai: string; english: string; thaiMasculine?: string; thaiFeminine?: string },
    number: number
  ) {
    // Prompt in English
    await this.addSegment({
      type: 'instruction',
      text: `How do you say: ${card.english}?`,
      voice: 'english'
    });

    // Pause for user to think/speak
    await this.addSilence(this.config.pauseDurationMs.beforeAnswer);

    // Give the answer
    const thaiText = this.getThaiText(card);
    for (let i = 0; i < this.config.repetitions.practice; i++) {
      await this.addSegment({
        type: 'thai',
        text: thaiText,
        voice: 'thai'
      });

      if (i < this.config.repetitions.practice - 1) {
        await this.addSilence(this.config.pauseDurationMs.forPractice);
      }
    }
  }

  // Review phase
  private async reviewPhrase(
    card: { thai: string; english: string; thaiMasculine?: string; thaiFeminine?: string }
  ) {
    const thaiText = this.getThaiText(card);
    
    // Thai first
    await this.addSegment({
      type: 'thai',
      text: thaiText,
      voice: 'thai'
    });

    await this.addSilence(1000);

    // English translation
    await this.addSegment({
      type: 'english',
      text: card.english,
      voice: 'english'
    });
  }

  // Get appropriate Thai text based on gender setting
  private getThaiText(card: { thai: string; thaiMasculine?: string; thaiFeminine?: string }): string {
    if (this.config.voiceGender === 'male' && card.thaiMasculine) {
      return card.thaiMasculine;
    } else if (this.config.voiceGender === 'female' && card.thaiFeminine) {
      return card.thaiFeminine;
    }
    return card.thai;
  }

  // Add a segment to the lesson
  private async addSegment(segment: LessonSegment) {
    if (segment.type === 'silence' && segment.durationMs) {
      await this.addSilence(segment.durationMs);
    } else if (segment.text) {
      const audio = await this.synthesizeSpeech(segment.text, segment.voice || 'english');
      this.audioSegments.push(audio);
    }
  }

  // Add silence to the lesson
  private async addSilence(durationMs: number) {
    const silence = this.azureTTS.createSilence(durationMs, this.sampleRate);
    this.audioSegments.push(silence);
  }

  // Synthesize speech using Azure TTS
  private async synthesizeSpeech(text: string, voice: 'thai' | 'english'): Promise<ArrayBuffer> {
    try {
      const audioData = await this.azureTTS.synthesizeToBuffer(
        text,
        voice,
        this.config.voiceGender
      );
      return audioData;
    } catch (error) {
      console.error(`Error synthesizing ${voice} speech:`, error);
      throw error;
    }
  }

  // Combine all audio segments into a single file
  private combineSegments(): ArrayBuffer {
    return AudioCombiner.combineWavBuffers(this.audioSegments);
  }
} 