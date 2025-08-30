#!/usr/bin/env tsx

/**
 * Script to check which flashcard sets have invalid mnemonics
 * This doesn't require API keys - just checks the database
 */

import { prisma } from '../app/lib/prisma';
import { isInvalidMnemonic } from '../app/lib/mnemonic-breakdown';

async function checkMnemonics() {
  console.log('🔍 Checking for invalid mnemonics in flashcard sets...\n');
  
  try {
    // Get all flashcard sets with their phrases
    const sets = await prisma.flashcardSet.findMany({
      include: {
        phrases: {
          select: {
            id: true,
            english: true,
            thai: true,
            pronunciation: true,
            mnemonic: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📚 Found ${sets.length} flashcard sets\n`);
    
    let totalInvalid = 0;
    const problematicSets: Array<{
      name: string;
      id: string;
      invalidCount: number;
      examples: Array<{ english: string; mnemonic: string }>
    }> = [];
    
    // Check each set
    for (const set of sets) {
      let invalidCount = 0;
      const examples: Array<{ english: string; mnemonic: string }> = [];
      
      for (const phrase of set.phrases) {
        if (phrase.mnemonic && phrase.pronunciation && phrase.english) {
          if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
            invalidCount++;
            totalInvalid++;
            
            // Collect first 2 examples per set
            if (examples.length < 2) {
              examples.push({
                english: phrase.english,
                mnemonic: phrase.mnemonic.substring(0, 150) + '...'
              });
            }
          }
        }
      }
      
      if (invalidCount > 0) {
        problematicSets.push({
          name: set.name,
          id: set.id,
          invalidCount,
          examples
        });
      }
    }
    
    // Display results
    if (problematicSets.length === 0) {
      console.log('✅ Great news! All mnemonics look valid.\n');
    } else {
      console.log(`❌ Found ${totalInvalid} invalid mnemonics across ${problematicSets.length} sets:\n`);
      
      for (const set of problematicSets) {
        console.log(`📖 ${set.name} (${set.id})`);
        console.log(`   Invalid mnemonics: ${set.invalidCount}`);
        console.log(`   Examples:`);
        for (const example of set.examples) {
          console.log(`   - "${example.english}"`);
          console.log(`     Current: ${example.mnemonic}\n`);
        }
      }
      
      console.log('\n💡 To fix these mnemonics:');
      console.log('   1. Wait for the deployment to complete (5-10 minutes)');
      console.log('   2. Then run: curl -X POST https://thaiflashcardsapp-production.up.railway.app/api/fix-mnemonics -H "Content-Type: application/json" -d \'{"fixAll": true}\'');
    }
    
  } catch (error) {
    console.error('❌ Error checking mnemonics:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkMnemonics()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
