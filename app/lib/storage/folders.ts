import { prisma } from '../prisma';

export interface Folder {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  setCount?: number; // Not in DB, calculated on the fly
  previewImages?: string[]; // First 4 set images for collage
}

export interface FolderWithSets extends Folder {
  sets: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    phraseCount: number;
    createdAt: string;
  }>;
}

// Default folder names
export const DEFAULT_FOLDERS = {
  DEFAULT_SETS: 'Default Sets',
  COMMON_WORDS: '100 Most Used Thai Words',
  COMMON_SENTENCES: '100 Most Used Thai Sentences',
  MY_SETS: 'My Sets', // Kept for backward compatibility
  MY_AUTOMATIC_SETS: 'My Automatic Sets',
  MY_MANUAL_SETS: 'My Manual Sets',
  IMPORTED_SETS: 'Imported Sets'
} as const;

/**
 * Get all folders for a user, including set counts and preview images
 */
export async function getUserFolders(userId: string): Promise<Folder[]> {
  const folders = await prisma.folder.findMany({
    where: { userId },
    include: {
      sets: {
        select: {
          id: true,
          imageUrl: true
        }
      }
    },
    orderBy: [
      { isDefault: 'desc' }, // Default folders first
      { orderIndex: 'asc' },
      { name: 'asc' }
    ]
  });

  return folders.map(folder => ({
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    description: folder.description,
    isDefault: folder.isDefault,
    orderIndex: folder.orderIndex,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    setCount: folder.sets.length,
    previewImages: folder.sets
      .slice(0, 4)
      .map(set => set.imageUrl)
      .filter((url): url is string => url !== null)
  }));
}

/**
 * Create default folders for a user
 */
export async function createDefaultFolders(userId: string) {
  // Check if user already has default folders
  const existingFolders = await prisma.folder.findMany({
    where: {
      userId,
      isDefault: true
    }
  });

  if (existingFolders.length > 0) {
    return; // Default folders already exist
  }

  // Create the default folders
  const defaultFolders = [
    {
      userId,
      name: DEFAULT_FOLDERS.DEFAULT_SETS,
      description: 'Core flashcard sets for beginners',
      isDefault: true,
      orderIndex: 0
    },
    {
      userId,
      name: DEFAULT_FOLDERS.COMMON_WORDS,
      description: '100 most frequently used Thai words',
      isDefault: true,
      orderIndex: 1
    },
    {
      userId,
      name: DEFAULT_FOLDERS.COMMON_SENTENCES,
      description: '100 most useful Thai sentences',
      isDefault: true,
      orderIndex: 2
    },
    {
      userId,
      name: DEFAULT_FOLDERS.MY_AUTOMATIC_SETS,
      description: 'Flashcard sets generated automatically',
      isDefault: true,
      orderIndex: 3
    },
    {
      userId,
      name: DEFAULT_FOLDERS.MY_MANUAL_SETS,
      description: 'Flashcard sets created from your custom phrases',
      isDefault: true,
      orderIndex: 4
    },
    {
      userId,
      name: DEFAULT_FOLDERS.IMPORTED_SETS,
      description: 'Flashcard sets imported from friends or the public gallery',
      isDefault: true,
      orderIndex: 5
    }
  ];

  await prisma.folder.createMany({
    data: defaultFolders
  });
}

/**
 * Create a new folder
 */
export async function createFolder(
  userId: string,
  name: string,
  description?: string
): Promise<Folder> {
  // Get the highest orderIndex for custom folders
  const highestOrder = await prisma.folder.findFirst({
    where: {
      userId,
      isDefault: false
    },
    orderBy: {
      orderIndex: 'desc'
    }
  });

  const folder = await prisma.folder.create({
    data: {
      userId,
      name,
      description,
      orderIndex: (highestOrder?.orderIndex ?? 3) + 1 // After default folders
    }
  });

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    description: folder.description,
    isDefault: folder.isDefault,
    orderIndex: folder.orderIndex,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    setCount: 0,
    previewImages: []
  };
}

/**
 * Update a folder
 */
export async function updateFolder(
  folderId: string,
  userId: string,
  data: { name?: string; description?: string }
): Promise<Folder | null> {
  const folder = await prisma.folder.update({
    where: {
      id: folderId,
      userId, // Ensure user owns the folder
      isDefault: false // Can't update default folders
    },
    data,
    include: {
      sets: {
        select: {
          id: true,
          imageUrl: true
        }
      }
    }
  });

  if (!folder) return null;

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    description: folder.description,
    isDefault: folder.isDefault,
    orderIndex: folder.orderIndex,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    setCount: folder.sets.length,
    previewImages: folder.sets
      .slice(0, 4)
      .map(set => set.imageUrl)
      .filter((url): url is string => url !== null)
  };
}

/**
 * Delete a folder (only non-default folders)
 */
export async function deleteFolder(
  folderId: string,
  userId: string
): Promise<boolean> {
  try {
    await prisma.folder.delete({
      where: {
        id: folderId,
        userId,
        isDefault: false // Can't delete default folders
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Move a flashcard set to a folder
 */
export async function moveSetToFolder(
  setId: string,
  folderId: string | null,
  userId: string
): Promise<boolean> {
  try {
    await prisma.flashcardSet.update({
      where: {
        id: setId,
        userId // Ensure user owns the set
      },
      data: {
        folderId
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get folder details with all sets
 */
export async function getFolderWithSets(
  folderId: string,
  userId: string
): Promise<FolderWithSets | null> {
  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      userId
    },
    include: {
      sets: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          createdAt: true,
          phrases: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!folder) return null;

  return {
    id: folder.id,
    userId: folder.userId,
    name: folder.name,
    description: folder.description,
    isDefault: folder.isDefault,
    orderIndex: folder.orderIndex,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    sets: folder.sets.map(set => ({
      id: set.id,
      name: set.name,
      imageUrl: set.imageUrl,
      phraseCount: set.phrases.length,
      createdAt: set.createdAt.toISOString()
    }))
  };
}

// Re-export from default-folder-assignment
export { assignDefaultSetsToFolders } from './default-folder-assignment';

/**
 * Get the appropriate folder ID for a new set based on its source
 */
export async function getTargetFolderForNewSet(
  userId: string, 
  source: 'manual' | 'generated' | 'auto' | 'import'
): Promise<string | null> {
  try {
    let folderName: string;
    if (source === 'manual') {
      folderName = DEFAULT_FOLDERS.MY_MANUAL_SETS;
    } else if (source === 'import') {
      folderName = DEFAULT_FOLDERS.IMPORTED_SETS;
    } else {
      folderName = DEFAULT_FOLDERS.MY_AUTOMATIC_SETS;
    }
    
    const folder = await prisma.folder.findFirst({
      where: {
        userId,
        name: folderName
      }
    });
    
    return folder?.id || null;
  } catch (error) {
    console.error('Error getting target folder:', error);
    return null;
  }
}
