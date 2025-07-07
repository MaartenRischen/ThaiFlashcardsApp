import { v4 as uuidv4 } from 'uuid';
import { FlashcardSet } from '@prisma/client';
import { SetMetaData } from './types';
import { getToneLabel } from '@/app/lib/utils';

// Helper function to get error message from unknown error types
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'An unknown error occurred';
}

// Generate UUID
export function generateUUID(): string {
  return uuidv4();
}

// Map database record to storage metadata
export function mapDatabaseToStorage(
  dbSet: FlashcardSet & { _count?: { phrases: number } }
): SetMetaData {
  const toneLevelValue = dbSet.seriousnessLevel;
  const toneLabel = toneLevelValue !== null ? getToneLabel(toneLevelValue) : null;

  return {
    id: dbSet.id,
    name: dbSet.name,
    cleverTitle: dbSet.cleverTitle || undefined,
    createdAt: dbSet.createdAt.toISOString(),
    phraseCount: dbSet._count?.phrases || 0,
    level: dbSet.level as SetMetaData['level'] || undefined,
    goals: dbSet.goals || [],
    specificTopics: dbSet.specificTopics || undefined,
    source: dbSet.source as SetMetaData['source'] || 'generated',
    imageUrl: dbSet.imageUrl || undefined,
    isFullyLearned: false,
    seriousnessLevel: toneLevelValue,
    toneLevel: toneLabel,
    llmBrand: dbSet.llmBrand || undefined,
    llmModel: dbSet.llmModel || undefined
  };
}

// Map storage metadata to database format
export function mapStorageToDatabase(
  storageSet: SetMetaData
): Omit<FlashcardSet, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'shareId' | 'toneLevel'> {
  const { toneLevel, isFullyLearned, phraseCount, createdAt, id, ...rest } = storageSet;

  return {
    ...rest,
    cleverTitle: rest.cleverTitle || null,
    level: rest.level || null,
    goals: rest.goals || [],
    specificTopics: rest.specificTopics || null,
    imageUrl: rest.imageUrl || null,
    seriousnessLevel: rest.seriousnessLevel,
    llmBrand: rest.llmBrand || null,
    llmModel: rest.llmModel || null,
  };
} 