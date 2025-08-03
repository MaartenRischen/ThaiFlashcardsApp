import { Phrase } from '@/app/lib/generation/types';

export interface VideoLessonConfig {
  width?: number;
  height?: number;
  fps?: number;
  fontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
  textColor?: string;
  highlightColor?: string;
  pronunciationColor?: string;
  mnemonicColor?: string;
  speed?: number;
  loops?: number;
  phraseRepetitions?: number;
  voiceGender?: 'male' | 'female';
  includeMnemonics?: boolean;
}

export interface TextOverlay {
  text: string;
  startTime: number;
  endTime: number;
  type: 'thai' | 'english' | 'pronunciation' | 'mnemonic';
  highlight?: boolean;
  phraseIndex?: number;
}

export interface AudioTiming {
  phraseIndex: number;
  type: 'english' | 'thai' | 'mnemonic' | 'pause';
  startTime: number;
  endTime: number;
  isActive?: boolean;
  repetition?: number;
  instructionText?: string;
}

export interface VideoGenerationResult {
  url: string;
  duration: number;
  format: 'mp4' | 'webm';
  width: number;
  height: number;
  fps: number;
}

export interface VideoLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  phrases: Phrase[];
  setName: string;
  audioConfig: {
    voiceGender?: 'male' | 'female';
    loops?: number;
    speed?: number;
    phraseRepetitions?: number;
    includeMnemonics?: boolean;
    includePolitenessParticles?: boolean;
    pauseBetweenPhrases?: number;
  };
  lessonType: 'simple' | 'structured';
}