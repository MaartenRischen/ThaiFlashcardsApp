import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { PublishedSetData } from './types';
import { Phrase } from '../set-generator';

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

  const createdPublishedSet = await prisma.publishedSet.create({
    data: dataToSave
  });
  
  return createdPublishedSet;
}

// Fetch all published sets (metadata only)
export async function getAllPublishedSets() {
  const publishedSets = await prisma.publishedSet.findMany({
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
    },
    orderBy: { 
      publishedAt: 'desc'
    }
  });
  
  return publishedSets || [];
}

// Fetch a single published set by ID (full data)
export async function getPublishedSetById(id: string) {
  const publishedSet = await prisma.publishedSet.findUnique({
    where: {
      id: id,
    },
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
      phrases: true, // Keep phrases for viewing/importing
    },
  });
  
  return publishedSet;
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