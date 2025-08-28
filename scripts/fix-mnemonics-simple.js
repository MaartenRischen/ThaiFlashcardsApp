const fs = require('fs').promises;
const path = require('path');

// Problematic patterns to check
const PRONOUN_PATTERNS = [
  /\bchan\b/gi,
  /\bchǎn\b/gi,
  /\bpom\b/gi,
  /\bpǒm\b/gi,
  /\bphom\b/gi,
  /\bdichan\b/gi,
  /\bdichǎn\b/gi
];

const PARTICLE_PATTERNS = [
  /\bkráp\b/gi,
  /\bkrap\b/gi,
  /\bkrub\b/gi,
  /\bká\b/gi,
  /\bka\b/gi,
  /\bkhá\b/gi,
  /\bkha\b/gi
];

// Mnemonic replacements for common phrases
const MNEMONIC_REPLACEMENTS = {
  // Greetings and Basic Phrases
  "Hello": "Think: 'Sa-what-dee' - Say what? Dee! (hello)",
  "Thank you": "Think: 'Cop-coon' - cop thanks you coon",
  "Excuse me / Sorry": "Think: 'Kaw-tote' - call toad to excuse",
  "You're welcome": "Think: 'My pen rye' - my pen writes 'you're welcome'",
  "Goodbye": "Think: 'Laa-gone' - la, I'm gone (bye)",
  
  // Questions
  "How much?": "Think: 'Tao-rye' - towel price (how much)",
  "Where is...?": "Think: 'You-tea-nigh' - you tea at night where?",
  "Can you help me?": "Think: 'Chew-ay-die-my' - chew hay, did I? (help me)",
  "What is this?": "Think: 'Knee-cow-rye' - knee cow, what rice?",
  "Do you have...?": "Think: 'Me-my' - me have my...?",
  
  // Directions and Travel
  "I want to go to...": "Think: 'Yak-pie' - yak wants pie at...",
  "Turn left/right": "Think: 'Leo-sigh/qua' - Leo sighs left, goes qua right",
  "Go straight": "Think: 'Trong-pie' - strong pie goes straight",
  "Stop here": "Think: 'Yoot-tea-knee' - you tea at knee (stop)",
  
  // Food and Dining
  "I want...": "Think: 'Ao' - Ow! I want",
  "Can I have the bill?": "Think: 'Kaw-bin-noy' - call bin boy (bill)",
  "Delicious": "Think: 'A-roy' - Ahoy! Delicious",
  "Not spicy": "Think: 'My-pet' - my pet no spicy",
  
  // Shopping and Numbers
  "Expensive": "Think: 'Pang' - pang! expensive",
  "Cheap": "Think: 'Took' - took it cheap",
  "Can you reduce the price?": "Think: 'Lot-die-my' - lot price down, my?",
  
  // Time and Situations
  "Now": "Think: 'Torn-knee' - torn knee now",
  "Today": "Think: 'One-knee' - won knee today",
  "Tomorrow": "Think: 'Prong-knee' - prong knee tomorrow",
  "I don't understand": "Think: 'Cow-jai' - cow jai don't understand"
};

function checkMnemonic(mnemonic) {
  // Check for pronouns
  for (const pattern of PRONOUN_PATTERNS) {
    if (pattern.test(mnemonic)) {
      return { valid: false, reason: 'contains pronouns' };
    }
  }
  
  // Check for particles
  for (const pattern of PARTICLE_PATTERNS) {
    if (pattern.test(mnemonic)) {
      return { valid: false, reason: 'contains particles' };
    }
  }
  
  // Check for placeholder text
  if (mnemonic.includes('create your own') || 
      mnemonic.includes('sound association')) {
    return { valid: false, reason: 'placeholder text' };
  }
  
  return { valid: true };
}

function findBetterMnemonic(english, pronunciation) {
  // Clean pronunciation
  let cleanPron = pronunciation
    .replace(/\b(chǎn|chan|pǒm|pom|phom)\/?(chǎn|chan|pǒm|pom|phom)?\b/gi, '')
    .replace(/\b(kráp|krap|krub|ká|ka|khá|kha)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check for exact matches first
  for (const [key, value] of Object.entries(MNEMONIC_REPLACEMENTS)) {
    if (english.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Generate based on pattern
  const words = cleanPron.split(' ');
  if (words.length === 0) return null;
  
  // For single words
  if (words.length === 1) {
    return `Think: '${words[0]}' - sounds like ${english.toLowerCase()}`;
  }
  
  // For short phrases
  if (words.length <= 3) {
    return `Think: '${words.join('-')}' - ${english.toLowerCase()}`;
  }
  
  // For longer phrases, focus on key words
  const keyWords = words.slice(0, 2);
  return `Think: '${keyWords.join('-')}...' - ${english.toLowerCase()}`;
}

async function fixMnemonics() {
  const dataDir = path.join(__dirname, '..', 'app', 'data');
  
  // Files to process
  const files = [
    'common-sentences-sets.ts',
    'common-sentences-sets-2.ts',
    'common-words-sets.ts',
    'default-sets.ts'
  ];
  
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`\nProcessing ${file}...`);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let modifiedCount = 0;
      
      // Find all phrase blocks
      const phraseBlocks = content.match(/\{[^{}]*english:\s*"[^"]+[^{}]*mnemonic:\s*"[^"]+[^{}]*\}/gs) || [];
      
      for (const block of phraseBlocks) {
        // Extract fields
        const englishMatch = block.match(/english:\s*"([^"]+)"/);
        const mnemonicMatch = block.match(/mnemonic:\s*"([^"]+)"/);
        const pronunciationMatch = block.match(/pronunciation:\s*"([^"]+)"/);
        
        if (englishMatch && mnemonicMatch && pronunciationMatch) {
          const english = englishMatch[1];
          const mnemonic = mnemonicMatch[1];
          const pronunciation = pronunciationMatch[1];
          
          const check = checkMnemonic(mnemonic);
          
          if (!check.valid) {
            console.log(`\n  Found issue (${check.reason}): "${english}"`);
            console.log(`  Old: "${mnemonic}"`);
            
            const newMnemonic = findBetterMnemonic(english, pronunciation);
            
            if (newMnemonic) {
              // Replace in content
              const oldMnemonicLine = `mnemonic: "${mnemonic}"`;
              const newMnemonicLine = `mnemonic: "${newMnemonic}"`;
              content = content.replace(oldMnemonicLine, newMnemonicLine);
              
              console.log(`  New: "${newMnemonic}"`);
              modifiedCount++;
            }
          }
        }
      }
      
      if (modifiedCount > 0) {
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`\n✓ Fixed ${modifiedCount} mnemonics in ${file}`);
        totalFixed += modifiedCount;
      } else {
        console.log(`✓ No issues found in ${file}`);
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log(`\n✅ Fixed ${totalFixed} mnemonics total!`);
}

// Run the fix
fixMnemonics().catch(console.error);
