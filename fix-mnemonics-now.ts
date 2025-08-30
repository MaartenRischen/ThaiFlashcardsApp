#!/usr/bin/env npx tsx

/**
 * Quick script to fix mnemonics directly in the database
 * Run this with: npx tsx fix-mnemonics-now.ts
 */

import dotenv from 'dotenv';
dotenv.config();

// We need to set the GEMINI_API_KEY from the environment for the script
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  console.error('Please create a .env file with your GEMINI_API_KEY');
  process.exit(1);
}

// Now we can import the modules that depend on the API key
import { prisma } from './app/lib/prisma';
import { generateMnemonic } from './app/lib/gemini';
import { isInvalidMnemonic } from './app/lib/mnemonic-breakdown';

async function fixMnemonics() {
  console.log('🔧 Starting mnemonic fix process...\n');
  
  try {
    // Get all flashcard sets with their phrases
    const sets = await prisma.flashcardSet.findMany({
      include: {
        phrases: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📚 Found ${sets.length} flashcard sets to check\n`);
    
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
            if (newMnemonic.includes('Remember these key parts:')) {
              console.log(`     (Using breakdown approach)`);
            }
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
fixMnemonics()
  .then(() => {
    console.log('\n✅ Mnemonic fix process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
