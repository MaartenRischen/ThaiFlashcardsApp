import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

// GET /api/share/[shareId]
// Returns the shared set (public, read‑only)
export async function GET(req: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const shareId = params.shareId;
    const set = await prisma.flashcardSet.findFirst({
      where: { shareId },
      include: { phrases: true },
    });
    if (!set) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    const transformed = {
      ...set,
      phrases: set.phrases.map((p) => {
        const { examplesJson, ...rest } = p;
        return { ...rest, examples: examplesJson || [] };
      })
    };

    return NextResponse.json({ set: transformed });
  } catch (err) {
    console.error('[share-fetch] ', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/share/[shareId] (authenticated) – imports the shared set into caller's account
export async function POST(req: NextRequest, { params }: { params: { shareId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shareId = params.shareId;
    const original = await prisma.flashcardSet.findFirst({
      where: { shareId },
      include: { phrases: true },
    });
    if (!original) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    const newSetId = randomUUID();

    await prisma.$transaction([
      prisma.flashcardSet.create({
        data: {
          id: newSetId,
          userId: userId,
          name: original.name,
          cleverTitle: original.cleverTitle,
          level: original.level,
          goals: original.goals,
          specificTopics: original.specificTopics,
          source: 'import',
          imageUrl: original.imageUrl,
          seriousnessLevel: original.seriousnessLevel,
        },
      }),
      prisma.phrase.createMany({
        data: original.phrases.map((p) => ({
          id: randomUUID(),
          setId: newSetId,
          english: p.english,
          thai: p.thai,
          thaiMasculine: p.thaiMasculine,
          thaiFeminine: p.thaiFeminine,
          pronunciation: p.pronunciation,
          mnemonic: p.mnemonic,
          examplesJson: p.examplesJson as Prisma.InputJsonValue
        })),
      })
    ]);

    return NextResponse.json({ newSetId });
  } catch (err) {
    console.error('[share-import] ', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 