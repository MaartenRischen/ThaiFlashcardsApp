import { Phrase } from '@/app/lib/set-generator';

// --- Type Definitions ---

export interface SetMetaData {
  id: string;
  name: string;
  cleverTitle?: string;
  createdAt: string;
  phraseCount: number;
  level?: 'complete beginner' | 'basic understanding' | 'intermediate' | 'advanced' | 'native/fluent' | 'god mode';
  goals?: string[];
  specificTopics?: string;
  source: 'default' | 'import' | 'generated';
  imageUrl?: string | null;
  isFullyLearned?: boolean;
  seriousnessLevel: number | null;
  toneLevel: string | null;
  llmBrand?: string;
  llmModel?: string;
}

export interface PhraseProgressData {
  srsLevel: number;
  nextReviewDate: string;
  lastReviewedDate: string;
  difficulty: 'easy' | 'good' | 'hard';
  repetitions: number;
  easeFactor: number;
}

export type SetProgress = { [cardIndex: number]: PhraseProgressData };

export interface PublishedSetData {
  title: string;
  description?: string;
  imageUrl?: string;
  cardCount: number;
  author: string;
  llmBrand?: string;
  llmModel?: string;
  seriousnessLevel?: number;
  specificTopics?: string;
  phrases: Phrase[];
} 