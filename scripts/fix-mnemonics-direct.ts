#!/usr/bin/env tsx
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables FIRST, before any other imports
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Now import modules that depend on environment variables
import { PrismaClient } from '@prisma/client';
import { generateMnemonic } from '../app/lib/gemini';
import { isInvalidMnemonic } from '../app/lib/mnemonic-breakdown';

const prisma = new PrismaClient();

async function fixMnemonics() {
  try {
    console.log('Starting mnemonic fix process...');
    
    // Get all flashcard sets with their phrases
    const sets = await prisma.flashcardSet.findMany({
      include: { phrases: true }
    });
    
    let totalFixed = 0;
    let totalChecked = 0;
    const fixedSets: string[] = [];
    
    for (const set of sets) {
      console.log(`\n\nChecking set: ${set.name} (${set.id})`);
      let setFixed = false;
      
      for (const phrase of set.phrases) {
        totalChecked++;
        
        // Check if mnemonic needs fixing
        if (phrase.mnemonic && phrase.pronunciation && phrase.english) {
          if (isInvalidMnemonic(phrase.mnemonic, phrase.pronunciation, phrase.english)) {
            console.log(`\n  - Fixing mnemonic for: "${phrase.english}"`);
            console.log(`    Old mnemonic: "${phrase.mnemonic}"`);
            
            try {
              // Generate new mnemonic with breakdown support
              const newMnemonic = await generateMnemonic(
                phrase.thai,
                phrase.english,
                phrase.pronunciation
              );
              
              console.log(`    New mnemonic: "${newMnemonic}"`);
              
              // Update the phrase with new mnemonic
              await prisma.phrase.update({
                where: { id: phrase.id },
                data: { mnemonic: newMnemonic }
              });
              
              totalFixed++;
              setFixed = true;
            } catch (error) {
              console.error(`    Failed to fix mnemonic for phrase ${phrase.id}:`, error);
            }
          }
        }
      }
      
      if (setFixed) {
        fixedSets.push(set.id);
      }
    }
    
    console.log('\n\n===== SUMMARY =====');
    console.log(`Total phrases checked: ${totalChecked}`);
    console.log(`Total mnemonics fixed: ${totalFixed}`);
    console.log(`Sets updated: ${fixedSets.length}`);
    console.log(`Updated set IDs: ${fixedSets.join(', ')}`);
    
  } catch (error) {
    console.error('Error fixing mnemonics:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixMnemonics().catch(console.error);
