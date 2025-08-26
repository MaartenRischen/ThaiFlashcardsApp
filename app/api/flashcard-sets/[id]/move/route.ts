import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { moveSetToFolder } from '@/app/lib/storage/folders';
import { z } from 'zod';

// Schema for moving a set
const moveSetSchema = z.object({
  folderId: z.string().nullable() // null means move to root (no folder)
});

// POST: Move a set to a folder
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = moveSetSchema.parse(body);

    const success = await moveSetToFolder(
      params.id,
      validatedData.folderId,
      userId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Set or folder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error moving set:', error);
    return NextResponse.json(
      { error: 'Failed to move set' },
      { status: 500 }
    );
  }
}
