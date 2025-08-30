#!/usr/bin/env tsx

/**
 * Script to fix mnemonics in existing flashcard sets
 * Checks all sets for invalid mnemonics and regenerates them using the breakdown approach
 */

import { prisma } from '../app/lib/prisma';
import { generateMnemonic } from '../app/lib/gemini';
import { isInvalidMnemonic } from '../app/lib/mnemonic-breakdown';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fixExistingMnemonics() {
  console.log('🔧 Starting mnemonic fix process...');
  
  try {
    // Get all flashcard sets with their phrases
    const sets = await prisma.flashcardSet.findMany({
      include: {
        phrases: true
      }
    });
    
    console.log(`📚 Found ${sets.length} flashcard sets to check`);
    
    let totalPhrases = 0;
    let fixedPhrases = 0;
    let failedFixes = 0;
    
    // Process each set
    for (const set of sets) {
      console.log(`\n📖 Checking set: ${set.name} (${set.id})`);
      let setFixedCount = 0;
      
      for (const phrase of set.phrases) {
        totalPhrases++;
        
        // Skip if missing required fields
        if (!phrase.mnemonic || !phrase.pronunciation || !phrase.english || !phrase.thai) {
          continue;
        }
        
        // Check if mnemonic is invalid
        if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
          console.log(`  ❌ Invalid mnemonic found for: "${phrase.english}"`);
          console.log(`     Current: ${phrase.mnemonic.substring(0, 100)}...`);
          
          try {
            // Generate new mnemonic with breakdown support
            const newMnemonic = await generateMnemonic(
              phrase.thai,
              phrase.english,
              phrase.pronunciation
            );
            
            // Update the phrase in the database
            await prisma.phrase.update({
              where: { id: phrase.id },
              data: { mnemonic: newMnemonic }
            });
            
            console.log(`  ✅ Fixed with new mnemonic`);
            fixedPhrases++;
            setFixedCount++;
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`  ⚠️  Failed to fix mnemonic:`, error);
            failedFixes++;
          }
        }
      }
      
      if (setFixedCount > 0) {
        console.log(`  📝 Fixed ${setFixedCount} mnemonics in this set`);
      } else {
        console.log(`  ✨ All mnemonics in this set are valid`);
      }
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total phrases checked: ${totalPhrases}`);
    console.log(`  Mnemonics fixed: ${fixedPhrases}`);
    console.log(`  Failed fixes: ${failedFixes}`);
    console.log(`  Valid mnemonics: ${totalPhrases - fixedPhrases - failedFixes}`);
    
  } catch (error) {
    console.error('❌ Error during mnemonic fix process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixExistingMnemonics()
  .then(() => {
    console.log('\n✅ Mnemonic fix process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
