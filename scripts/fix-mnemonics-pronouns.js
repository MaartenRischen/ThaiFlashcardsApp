const fs = require('fs').promises;
const path = require('path');

// Import the mnemonic rules
const { 
  cleanPronunciationForMnemonic, 
  validateMnemonicContent,
  generateFallbackMnemonic,
  getPhraseType,
  extractKeySounds
} = require('../app/lib/mnemonic-rules.ts');

async function fixMnemonics() {
  const dataDir = path.join(__dirname, '..', 'app', 'data');
  
  // Files to process
  const files = [
    'common-sentences-sets.ts',
    'common-sentences-sets-2.ts',
    'common-words-sets.ts',
    'default-sets.ts'
  ];
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`\nProcessing ${file}...`);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let modifiedCount = 0;
      
      // Find all mnemonics with pronouns or problematic content
      const mnemonicPattern = /mnemonic:\s*"([^"]+)"/g;
      let match;
      const replacements = [];
      
      while ((match = mnemonicPattern.exec(content)) !== null) {
        const originalMnemonic = match[1];
        const validation = validateMnemonicContent(originalMnemonic);
        
        if (!validation.isValid) {
          console.log(`\n  Found problematic mnemonic: "${originalMnemonic}"`);
          console.log(`  Issues: ${validation.issues.join(', ')}`);
          
          // Try to find the context (english, pronunciation)
          const startPos = match.index;
          const contextStart = Math.max(0, startPos - 500);
          const contextEnd = Math.min(content.length, startPos + 500);
          const context = content.substring(contextStart, contextEnd);
          
          // Extract english and pronunciation from context
          const englishMatch = context.match(/english:\s*"([^"]+)"/);
          const pronunciationMatch = context.match(/pronunciation:\s*"([^"]+)"/);
          
          if (englishMatch && pronunciationMatch) {
            const english = englishMatch[1];
            const pronunciation = pronunciationMatch[1];
            
            // Generate a better mnemonic
            let newMnemonic = generateFallbackMnemonic(pronunciation, english);
            
            // Special cases for common patterns
            if (english.includes("I want to go to")) {
              newMnemonic = "Think: 'yak pai' - yak (want) to pie (go) there";
            } else if (english === "Where is...?") {
              newMnemonic = "Think: 'you tee nai' - you at where?";
            } else if (english === "Can you help me?") {
              newMnemonic = "Think: 'chuay dai mai' - chew-ay (help) die my?";
            } else if (english === "How much?") {
              newMnemonic = "Think: 'tao rai' - towel rye price?";
            } else if (english === "Thank you") {
              newMnemonic = "Think: 'kop kun' - cop saying thanks, kun";
            } else if (english === "Excuse me / Sorry") {
              newMnemonic = "Think: 'kaw tote' - call toad (excuse me)";
            } else if (english.includes("Turn left")) {
              newMnemonic = "Think: 'leo sai' - Leo sighs left";
            } else if (english.includes("Turn right")) {
              newMnemonic = "Think: 'leo khwa' - Leo goes qua (right)";
            }
            
            replacements.push({
              original: match[0],
              replacement: `mnemonic: "${newMnemonic}"`,
              english,
              pronunciation
            });
            
            console.log(`  New mnemonic: "${newMnemonic}"`);
            modifiedCount++;
          }
        }
      }
      
      // Apply replacements
      for (const rep of replacements) {
        content = content.replace(rep.original, rep.replacement);
      }
      
      if (modifiedCount > 0) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`\n✓ Fixed ${modifiedCount} mnemonics in ${file}`);
      } else {
        console.log(`✓ No problematic mnemonics found in ${file}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log('\n✅ Mnemonic fix complete!');
}

// Run the fix
fixMnemonics().catch(console.error);
