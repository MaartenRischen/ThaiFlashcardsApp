import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserFolders, createFolder, createDefaultFolders } from '@/app/lib/storage/folders';
import { z } from 'zod';

// Schema for creating a folder
const createFolderSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional()
});

// GET: Fetch all folders for the user
export async function GET() {
  try {
    const { userId } = await auth();
    
    // For unauthenticated users, return default folder structure
    if (!userId) {
      const defaultFolders = [
        {
          id: 'default-folder-default-sets',
          userId: 'anonymous',
          name: 'Default Sets',
          description: 'Core flashcard sets for beginners',
          isDefault: true,
          orderIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'default-folder-common-words',
          userId: 'anonymous',
          name: '100 Most Used Thai Words',
          description: '100 most frequently used Thai words',
          isDefault: true,
          orderIndex: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'default-folder-common-sentences',
          userId: 'anonymous',
          name: '100 Most Used Thai Sentences',
          description: '100 most useful Thai sentences',
          isDefault: true,
          orderIndex: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return NextResponse.json({ folders: defaultFolders });
    }

    // Ensure default folders exist
    await createDefaultFolders(userId);

    const folders = await getUserFolders(userId);
    return NextResponse.json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

// POST: Create a new folder
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createFolderSchema.parse(body);

    const folder = await createFolder(
      userId,
      validatedData.name,
      validatedData.description
    );

    return NextResponse.json({ folder });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 }
      );
    }

    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
