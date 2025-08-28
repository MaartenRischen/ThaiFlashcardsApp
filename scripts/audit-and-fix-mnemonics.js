const fs = require('fs').promises;
const path = require('path');

// Comprehensive mnemonic fixes for all common patterns
const MNEMONIC_FIXES = {
  // === GREETINGS & BASIC PHRASES ===
  "Hello": "Think: 'Sa-what-dee' - Say what? Dee! (hello)",
  "Thank you": "Think: 'Cop-coon' - cop thanks you",
  "Thank you very much": "Think: 'Cop-coon-maak' - cop thanks you, Mark",
  "You're welcome / It's okay": "Think: 'My pen rye' - my pen writes OK",
  "Excuse me / Sorry": "Think: 'Kaw-tote' - call toad (excuse me)",
  "Yes": "Think: 'Chai tea' - yes to chai tea",
  "No": "Think: 'My chai' - my, not chai (no)",
  "Goodbye": "Think: 'Laa-gone' - la, I'm gone",
  
  // === QUESTIONS ===
  "How much?": "Think: 'Tao-rye' - towel price?",
  "How much is this?": "Think: 'Knee-tao-rye' - knee towel price?",
  "Where is...?": "Think: 'You-tea-nigh' - you tea where?",
  "Where is the bathroom?": "Think: 'Hong-nam-you-tea-nigh' - bathroom you where?",
  "Can you help me?": "Think: 'Chew-ay-die-my' - chew aid, my?",
  "Do you have...?": "Think: 'Me-my' - me have my?",
  "What is this?": "Think: 'Knee-cow-rye' - knee cow rice (what's this)",
  "What's your name?": "Think: 'Coon-chew-rye' - kun, you who?",
  "Do you speak English?": "Think: 'Poot-paa-saa-ang-grit' - put pass English?",
  
  // === WANTS & NEEDS ===
  "I want...": "Think: 'Ao' - Ow! I want",
  "I want to go to...": "Think: 'Yak-pie' - yak wants pie there",
  "I don't want...": "Think: 'My-ao' - my, ow no (don't want)",
  "I would like...": "Think: 'Kaw' - call for (would like)",
  "I need...": "Think: 'Tong-gaan' - tongue can (need)",
  
  // === DIRECTIONS ===
  "Turn left": "Think: 'Leo-sigh' - Leo sighs left",
  "Turn right": "Think: 'Leo-qua' - Leo goes qua (right)",
  "Turn left/right": "Think: 'Leo-sigh/qua' - Leo sighs left, goes qua right",
  "Go straight": "Think: 'Trong-pie' - strong pie straight",
  "Stop here": "Think: 'Yoot-tea-knee' - you tea knee (stop)",
  "Here": "Think: 'Tea-knee' - at knee (here)",
  "There": "Think: 'Tea-nun' - tea none (there)",
  
  // === FOOD & DINING ===
  "Delicious": "Think: 'A-roy' - Ahoy! Delicious",
  "Very delicious": "Think: 'A-roy-maak' - Ahoy Mark! Very delicious",
  "Not spicy": "Think: 'My-pet' - my pet no spicy",
  "A little spicy": "Think: 'Pet-nit-noy' - pet neat boy (little spicy)",
  "Can I have the bill?": "Think: 'Kaw-bin-noy' - call bin boy (bill please)",
  "Can I have the menu?": "Think: 'Kaw-menu' - call menu",
  "Water": "Think: 'Nam' - nom nom water",
  "Rice": "Think: 'Cow' - cow eats rice",
  
  // === SHOPPING ===
  "How much does this cost?": "Think: 'An-knee-tao-rye' - on knee towel price?",
  "Expensive": "Think: 'Pang' - pang! expensive",
  "Very expensive": "Think: 'Pang-maak' - pang Mark! very expensive",
  "Cheap": "Think: 'Took' - took it cheap",
  "Can you reduce the price?": "Think: 'Lot-die-my' - lot price die, my?",
  "Can you give a discount?": "Think: 'Lot-raa-kaa' - lot rack-a discount?",
  
  // === TIME ===
  "Now": "Think: 'Torn-knee' - torn knee now",
  "Today": "Think: 'Wan-knee' - one knee today",
  "Tomorrow": "Think: 'Prong-knee' - prong knee tomorrow",
  "Yesterday": "Think: 'Mua-wan' - moo-a one yesterday",
  "What time?": "Think: 'Gee-mong' - key among time?",
  
  // === UNDERSTANDING ===
  "I understand": "Think: 'Cow-jai' - cow jai understands",
  "I don't understand": "Think: 'My-cow-jai' - my cow jai not understand",
  "Do you understand?": "Think: 'Cow-jai-my' - cow jai, my?",
  "Can you speak slowly?": "Think: 'Poot-cha-cha' - put cha-cha slowly",
  "Please repeat": "Think: 'Poot-eek-tee' - put eek tea (repeat)",
  
  // === BASIC ADJECTIVES ===
  "Good": "Think: 'Dee' - dee is good",
  "Bad": "Think: 'My-dee' - my, not dee (bad)",
  "Big": "Think: 'Yai' - yay! big",
  "Small": "Think: 'Lek' - like small",
  "Hot": "Think: 'Rawn' - Ron is hot",
  "Cold": "Think: 'Nao' - now cold",
  "Beautiful": "Think: 'Soo-ay' - sway beautiful",
  
  // === COMMON SENTENCES ===
  "Nice to meet you": "Think: 'Yin-dee-roo-jak' - yin dee, rouge jack",
  "See you later": "Think: 'Laew-pob-gan' - allow pop gun (see you)",
  "Take care": "Think: 'Doo-lae-tua' - do lay two-a (take care)",
  "Good luck": "Think: 'Chok-dee' - chalk dee (good luck)",
  "Have a safe trip": "Think: 'Dern-tang-plaw-pai' - turn tang plow pie (safe trip)",
  
  // === EMERGENCY ===
  "Help!": "Think: 'Chuay-duay' - chew-ay do-ay (help!)",
  "I'm sick": "Think: 'My-sa-baai' - my sah bye (not well)",
  "I need a doctor": "Think: 'Tong-gaan-maw' - tongue can more (need doctor)",
  "Emergency": "Think: 'Chook-chern' - chuck-churn emergency",
  "Police": "Think: 'Tam-ruat' - tam root police"
};

async function auditAndFixMnemonics() {
  const dataDir = path.join(__dirname, '..', 'app', 'data');
  const files = [
    'common-sentences-sets.ts',
    'common-sentences-sets-2.ts', 
    'common-words-sets.ts',
    'default-sets.ts'
  ];
  
  let totalIssues = 0;
  let totalFixed = 0;
  
  for (const file of files) {
    const filePath = path.join(dataDir, file);
    console.log(`\n📁 Processing ${file}...`);
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const issues = [];
      
      // Find all phrases with their complete context
      const phrasePattern = /\{[\s\S]*?english:\s*"([^"]+)"[\s\S]*?pronunciation:\s*"([^"]+)"[\s\S]*?mnemonic:\s*"([^"]+)"[\s\S]*?\}/g;
      let match;
      
      while ((match = phrasePattern.exec(content)) !== null) {
        const english = match[1];
        const pronunciation = match[2];
        const mnemonic = match[3];
        
        // Check for issues
        const problems = [];
        
        // 1. Check for pronouns in mnemonic
        if (/\b(chan|chǎn|pom|pǒm|phom|dichan|dichǎn)\b/i.test(mnemonic)) {
          problems.push('contains gender pronouns');
        }
        
        // 2. Check for particles
        if (/\b(kráp|krap|krub|ká|ka|khá|kha)\b/i.test(mnemonic)) {
          problems.push('contains politeness particles');
        }
        
        // 3. Check for placeholder text
        if (mnemonic.includes('create your own') || 
            mnemonic.includes('sound association') ||
            mnemonic.length < 20) {
          problems.push('placeholder or too short');
        }
        
        // 4. Check if mnemonic actually contains phonetic elements
        const cleanPron = pronunciation
          .replace(/[\/\-]/g, ' ')
          .replace(/\b(chǎn|chan|pǒm|pom|phom)\/?(chǎn|chan|pǒm|pom|phom)?\b/gi, '')
          .replace(/\b(kráp|krap|krub|ká|ka|khá|kha)\b/gi, '')
          .trim();
        
        const hasPhoneticConnection = cleanPron.split(' ').some(sound => 
          sound.length > 2 && mnemonic.toLowerCase().includes(sound.substring(0, 3).toLowerCase())
        );
        
        if (!hasPhoneticConnection && !mnemonic.includes('Think:')) {
          problems.push('no clear phonetic connection');
        }
        
        if (problems.length > 0) {
          issues.push({
            english,
            pronunciation,
            mnemonic,
            problems,
            matchText: match[0]
          });
          totalIssues++;
        }
      }
      
      // Fix issues
      if (issues.length > 0) {
        console.log(`\n  Found ${issues.length} issues:`);
        
        for (const issue of issues) {
          console.log(`\n  ❌ "${issue.english}"`);
          console.log(`     Problems: ${issue.problems.join(', ')}`);
          console.log(`     Old: "${issue.mnemonic}"`);
          
          // Find best replacement
          let newMnemonic = null;
          
          // First, check exact matches
          for (const [key, value] of Object.entries(MNEMONIC_FIXES)) {
            if (issue.english.toLowerCase() === key.toLowerCase() ||
                issue.english.toLowerCase().includes(key.toLowerCase())) {
              newMnemonic = value;
              break;
            }
          }
          
          // If no exact match, generate based on pattern
          if (!newMnemonic) {
            const cleanPron = issue.pronunciation
              .replace(/[\/\-]/g, ' ')
              .replace(/\b(chǎn|chan|pǒm|pom|phom)\/?(chǎn|chan|pǒm|pom|phom)?\b/gi, '')
              .replace(/\b(kráp|krap|krub|ká|ka|khá|kha)\b/gi, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            const words = cleanPron.split(' ').filter(w => w.length > 0);
            
            if (words.length === 1) {
              newMnemonic = `Think: '${words[0]}' - sounds like ${issue.english.toLowerCase()}`;
            } else if (words.length <= 3) {
              // Try to make creative sound associations
              const soundMap = {
                'yàak': 'yak', 'pai': 'pie', 'tîi': 'tea',
                'nǎi': 'nigh', 'mii': 'me', 'kɔ̌ɔ': 'kaw',
                'dâi': 'die', 'mâi': 'my', 'pen': 'pen',
                'rai': 'rye', 'níi': 'knee', 'nán': 'nun'
              };
              
              const mappedWords = words.map(w => {
                for (const [thai, eng] of Object.entries(soundMap)) {
                  if (w.includes(thai.replace(/[̀́̂̌]/g, ''))) {
                    return eng;
                  }
                }
                return w;
              });
              
              newMnemonic = `Think: '${mappedWords.join('-')}' - ${issue.english.toLowerCase()}`;
            } else {
              // For longer phrases, focus on key words
              const keyWords = words.slice(0, 2);
              newMnemonic = `Think: '${keyWords.join(' ')}...' for ${issue.english.toLowerCase()}`;
            }
          }
          
          if (newMnemonic) {
            console.log(`     New: "${newMnemonic}"`);
            
            // Replace in content
            const oldMnemonicLine = `mnemonic: "${issue.mnemonic}"`;
            const newMnemonicLine = `mnemonic: "${newMnemonic}"`;
            content = content.replace(oldMnemonicLine, newMnemonicLine);
            totalFixed++;
          }
        }
      } else {
        console.log(`  ✓ No issues found`);
      }
      
      // Write back if modified
      if (totalFixed > 0) {
        await fs.writeFile(filePath, content, 'utf-8');
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total issues found: ${totalIssues}`);
  console.log(`   Total fixed: ${totalFixed}`);
  console.log(`\n✅ Audit complete!`);
}

// Run the audit
auditAndFixMnemonics().catch(console.error);
