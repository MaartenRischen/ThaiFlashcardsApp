import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { generateMnemonic } from '@/app/lib/gemini';
import { isInvalidMnemonic } from '@/app/lib/mnemonic-breakdown';

export async function POST(req: NextRequest) {
  try {
    const { userId: _userId } = await auth();
    
    // This can be run by admin or system
    // For user-specific fixes, check userId
    
    const body = await req.json();
    const { setId, fixAll = false } = body;
    
    if (!setId && !fixAll) {
      return NextResponse.json(
        { error: 'Either setId or fixAll must be provided' },
        { status: 400 }
      );
    }
    
    // Get flashcard sets to fix
    const setsToFix = setId 
      ? await prisma.flashcardSet.findMany({
          where: { id: setId },
          include: { phrases: true }
        })
      : await prisma.flashcardSet.findMany({
          include: { phrases: true }
        });
    
    let totalFixed = 0;
    let totalChecked = 0;
    const fixedSets: string[] = [];
    
    for (const set of setsToFix) {
      let setFixed = false;
      
      for (const phrase of set.phrases) {
        totalChecked++;
        
        // Check if mnemonic needs fixing
        if (phrase.mnemonic && phrase.pronunciation && phrase.english) {
          if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
            console.log(`Fixing mnemonic for phrase: "${phrase.english}"`);
            
            try {
              // Generate new mnemonic with breakdown support
              const newMnemonic = await generateMnemonic(
                phrase.thai,
                phrase.english,
                phrase.pronunciation
              );
              
              // Update the phrase with new mnemonic
              await prisma.phrase.update({
                where: { id: phrase.id },
                data: { mnemonic: newMnemonic }
              });
              
              totalFixed++;
              setFixed = true;
            } catch (error) {
              console.error(`Failed to fix mnemonic for phrase ${phrase.id}:`, error);
            }
          }
        }
      }
      
      if (setFixed) {
        fixedSets.push(set.id);
      }
    }
    
    return NextResponse.json({
      message: 'Mnemonic fix completed',
      totalChecked,
      totalFixed,
      fixedSets
    });
  } catch (error) {
    console.error('Error fixing mnemonics:', error);
    return NextResponse.json(
      { error: 'Failed to fix mnemonics' },
      { status: 500 }
    );
  }
}

// GET endpoint to check which sets have bad mnemonics
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const checkAll = searchParams.get('checkAll') === 'true';
    const setId = searchParams.get('setId');
    
    const sets = setId
      ? await prisma.flashcardSet.findMany({
          where: { id: setId },
          include: { phrases: true }
        })
      : checkAll
      ? await prisma.flashcardSet.findMany({
          include: { phrases: true }
        })
      : [];
    
    const problematicSets: Array<{
      setId: string;
      setName: string;
      badMnemonics: Array<{
        phraseId: string;
        english: string;
        mnemonic: string;
        issue: string;
      }>;
    }> = [];
    
    for (const set of sets) {
      const badMnemonics: Array<{
        phraseId: string;
        english: string;
        mnemonic: string;
        issue: string;
      }> = [];
      
      for (const phrase of set.phrases) {
        if (phrase.mnemonic && phrase.pronunciation && phrase.english) {
          if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
            badMnemonics.push({
              phraseId: phrase.id,
              english: phrase.english,
              mnemonic: phrase.mnemonic,
              issue: 'Mnemonic just repeats pronunciation/translation without creative memory aid'
            });
          }
        }
      }
      
      if (badMnemonics.length > 0) {
        problematicSets.push({
          setId: set.id,
          setName: set.name,
          badMnemonics
        });
      }
    }
    
    return NextResponse.json({
      totalSetsChecked: sets.length,
      problematicSetsCount: problematicSets.length,
      problematicSets
    });
  } catch (error) {
    console.error('Error checking mnemonics:', error);
    return NextResponse.json(
      { error: 'Failed to check mnemonics' },
      { status: 500 }
    );
  }
}
