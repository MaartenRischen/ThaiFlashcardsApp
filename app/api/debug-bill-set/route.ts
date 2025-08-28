import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/app/lib/prisma';
import { getDefaultSetContent } from '@/app/lib/seed-default-sets';
import { ALL_COMMON_SENTENCES_SETS } from '@/app/data/common-sentences-sets';

export async function GET(_request: Request) {
  try {
    const { userId } = await auth();
    
    // Get the source data
    const sourceSet = ALL_COMMON_SENTENCES_SETS.find(s => s.id === 'common-sentences-2');
    const billPhraseInSource = sourceSet?.phrases.find(p => p.english === "Can I have the bill?");
    
    // Get the default content
    const defaultContent = getDefaultSetContent('default-common-sentences-2');
    const billPhraseInDefault = defaultContent?.find(p => p.english === "Can I have the bill?");
    
    let dbSet = null;
    let billPhraseInDb = null;
    
    if (userId) {
      // Check what's in the database
      dbSet = await prisma.flashcardSet.findFirst({
        where: {
          userId,
          OR: [
            { id: 'default-common-sentences-2' },
            { name: '100 Most Used Thai Sentences 2' }
          ]
        },
        include: {
          phrases: true
        }
      });
      
      if (dbSet) {
        const dbPhrase = dbSet.phrases.find(p => p.english === "Can I have the bill?");
        billPhraseInDb = dbPhrase ? {
          english: dbPhrase.english,
          thai: dbPhrase.thai,
          mnemonic: dbPhrase.mnemonic,
          pronunciation: dbPhrase.pronunciation
        } : null;
      }
    }
    
    return NextResponse.json({
      sourceData: {
        found: !!billPhraseInSource,
        mnemonic: billPhraseInSource?.mnemonic
      },
      defaultContent: {
        found: !!billPhraseInDefault,
        mnemonic: billPhraseInDefault?.mnemonic
      },
      database: {
        setFound: !!dbSet,
        setId: dbSet?.id,
        setName: dbSet?.name,
        phraseCount: dbSet?.phrases.length,
        billPhrase: billPhraseInDb
      }
    });

  } catch (error) {
    console.error('Error debugging bill set:', error);
    return NextResponse.json(
      { error: 'Failed to debug' },
      { status: 500 }
    );
  }
}
