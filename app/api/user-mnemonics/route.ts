import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { z } from 'zod';

// Schema for validating mnemonic data
const mnemonicSchema = z.object({
  setId: z.string().min(1, "Set ID is required"),
  phraseIndex: z.number().int().min(0),
  mnemonic: z.string()
});

// GET: Fetch all user mnemonics for a set or all sets
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const setId = searchParams.get('setId');

    let mnemonics;
    if (setId) {
      // Get mnemonics for a specific set
      mnemonics = await prisma.userMnemonic.findMany({
        where: {
          userId: userId,
          setId: setId
        },
        orderBy: {
          phraseIndex: 'asc'
        }
      });
    } else {
      // Get all mnemonics for the user
      mnemonics = await prisma.userMnemonic.findMany({
        where: {
          userId: userId
        },
        orderBy: [
          { setId: 'asc' },
          { phraseIndex: 'asc' }
        ]
      });
    }

    // Transform to the format expected by frontend
    const mnemonicsBySet: Record<string, Record<string, string>> = {};
    for (const mnemonic of mnemonics) {
      if (!mnemonicsBySet[mnemonic.setId]) {
        mnemonicsBySet[mnemonic.setId] = {};
      }
      mnemonicsBySet[mnemonic.setId][mnemonic.phraseIndex.toString()] = mnemonic.mnemonic;
    }

    return NextResponse.json(mnemonicsBySet);
  } catch (error) {
    console.error("Error fetching user mnemonics:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST: Save or update a mnemonic
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const result = mnemonicSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.format() },
        { status: 400 }
      );
    }

    const { setId, phraseIndex, mnemonic } = result.data;

    // If mnemonic is empty, delete the existing one
    if (!mnemonic.trim()) {
      await prisma.userMnemonic.deleteMany({
        where: {
          userId: userId,
          setId: setId,
          phraseIndex: phraseIndex
        }
      });
      
      return NextResponse.json({
        message: "Mnemonic deleted successfully"
      });
    }

    // Upsert the mnemonic
    const savedMnemonic = await prisma.userMnemonic.upsert({
      where: {
        userId_setId_phraseIndex: {
          userId: userId,
          setId: setId,
          phraseIndex: phraseIndex
        }
      },
      update: {
        mnemonic: mnemonic
      },
      create: {
        userId: userId,
        setId: setId,
        phraseIndex: phraseIndex,
        mnemonic: mnemonic
      }
    });

    return NextResponse.json({
      message: "Mnemonic saved successfully",
      mnemonic: savedMnemonic
    });
  } catch (error) {
    console.error("Error saving user mnemonic:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific mnemonic or all mnemonics for a set
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const setId = searchParams.get('setId');
    const phraseIndex = searchParams.get('phraseIndex');

    if (!setId) {
      return NextResponse.json(
        { error: "Set ID is required" },
        { status: 400 }
      );
    }

    if (phraseIndex !== null) {
      // Delete specific mnemonic
      await prisma.userMnemonic.deleteMany({
        where: {
          userId: userId,
          setId: setId,
          phraseIndex: parseInt(phraseIndex)
        }
      });
    } else {
      // Delete all mnemonics for the set
      await prisma.userMnemonic.deleteMany({
        where: {
          userId: userId,
          setId: setId
        }
      });
    }

    return NextResponse.json({
      message: "Mnemonic(s) deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user mnemonic:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
