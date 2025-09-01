import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { PublishedSetData } from './types';

// Heuristic estimators for gallery metadata when missing
function estimateProficiencyLevel(phrases: any[]): string {
  if (!Array.isArray(phrases) || phrases.length === 0) return 'Complete Beginner';
  const lengths = phrases
    .map(p => ((p?.english || p?.en || p?.translation || '') + '').trim().split(/\s+/).filter(Boolean).length)
    .filter(n => n > 0);
  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  if (avg <= 2) return 'Complete Beginner';
  if (avg <= 4) return 'Basic Understanding';
  if (avg <= 8) return 'Intermediate';
  if (avg <= 12) return 'Advanced';
  return 'Native/Fluent';
}

function estimateSeriousnessLevel(phrases: any[]): number {
  if (!Array.isArray(phrases) || phrases.length === 0) return 2;
  const text = phrases.map(p => `${p?.mnemonic || ''} ${p?.note || ''} ${p?.english || p?.en || ''}`).join(' ').toLowerCase();
  let score = 2;
  const funSignals = ['😂', '🤣', 'lol', 'haha', 'funny', 'joke', 'silly', 'meme', '!'];
  for (const sig of funSignals) {
    const re = new RegExp(sig.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    const count = (text.match(re) || []).length;
    score += Math.min(3, count);
  }
  return Math.max(1, Math.min(10, score));
}

// --- Gallery (PublishedSet) Functions ---

// Publish a set to the gallery
export async function publishSetToGallery(publishedSet: PublishedSetData) {
  const dataToSave = {
    title: publishedSet.title,
    description: publishedSet.description,
    imageUrl: publishedSet.imageUrl,
    cardCount: publishedSet.cardCount,
    author: publishedSet.author,
    llmBrand: publishedSet.llmBrand,
    llmModel: publishedSet.llmModel,
    seriousnessLevel: publishedSet.seriousnessLevel,
    specificTopics: publishedSet.specificTopics,
    phrases: publishedSet.phrases as unknown as Prisma.InputJsonValue,
    publishedAt: new Date().toISOString(),
  };

  console.log("--- DEBUG: Data being passed to prisma.publishedSet.create ---", JSON.stringify(dataToSave, null, 2));

  // Fill missing fields from phrases heuristically
  const phrasesArray: any[] = Array.isArray(publishedSet.phrases) ? (publishedSet.phrases as any[]) : [];
  if (dataToSave.seriousnessLevel == null) {
    (dataToSave as any).seriousnessLevel = estimateSeriousnessLevel(phrasesArray);
  }
  (dataToSave as any).proficiencyLevel = (publishedSet as any).proficiencyLevel || estimateProficiencyLevel(phrasesArray);

  const createdPublishedSet = await prisma.publishedSet.create({
    data: dataToSave as any
  });
  
  return createdPublishedSet;
}

// Fetch all published sets (metadata only)
export async function getAllPublishedSets() {
  const rows = await prisma.publishedSet.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      cardCount: true,
      author: true,
      llmBrand: true,
      llmModel: true,
      specificTopics: true,
      publishedAt: true,
      proficiencyLevel: true,
      seriousnessLevel: true,
      phrases: true,
    },
    orderBy: { publishedAt: 'desc' }
  });

  return rows.map((row: any) => {
    const phrases = Array.isArray(row.phrases) ? row.phrases : [];
    const proficiency = row.proficiencyLevel || estimateProficiencyLevel(phrases);
    const tone = row.seriousnessLevel ?? estimateSeriousnessLevel(phrases);
    const { phrases: _omit, ...rest } = row;
    return { ...rest, proficiencyLevel: proficiency, seriousnessLevel: tone };
  });
}

// Fetch a single published set by ID (full data)
export async function getPublishedSetById(id: string) {
  const row: any = await prisma.publishedSet.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
      cardCount: true,
      author: true,
      llmBrand: true,
      llmModel: true,
      specificTopics: true,
      publishedAt: true,
      phrases: true,
      proficiencyLevel: true,
      seriousnessLevel: true,
    },
  });
  if (!row) return null;
  const phrases = Array.isArray(row.phrases) ? row.phrases : [];
  const proficiency = row.proficiencyLevel || estimateProficiencyLevel(phrases);
  const tone = row.seriousnessLevel ?? estimateSeriousnessLevel(phrases);
  const { phrases: _omit, ...rest } = row;
  return { ...rest, proficiencyLevel: proficiency, seriousnessLevel: tone };
}

// Delete a published set from the gallery
export async function deletePublishedSet(id: string): Promise<boolean> {
  if (!id) {
    console.error('deletePublishedSet called without id.');
    return false;
  }
  
  try {
    await prisma.publishedSet.delete({
      where: { id },
    });
    
    console.log(`Successfully deleted published set with id: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting published set:', error);
    return false;
  }
} 