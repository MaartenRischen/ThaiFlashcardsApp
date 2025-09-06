import { GeneratePromptOptions } from './types';
import { getToneLabel } from '../utils';

export interface PromptConfig {
  model: string;
  level: string;
  context: string;
  toneDescription: string;
  count: number;
  systemPrompt: string;
  userPrompt: string;
}

export function generateSystemPrompt(toneDescription: string): string {
  return `You are an expert Thai language instructor specializing in natural, colloquial Thai as it's actually spoken. Your goal is to create authentic, memorable vocabulary sets that help learners build real-world conversational skills.

### CRITICAL RULES:
1. Generate EXACT NUMBER of phrases requested - no more, no less
2. Focus on natural phrases Thai people actually use, not literal translations
3. DO NOT include politeness particles (ครับ/ค่ะ/จ้ะ/จ๊ะ/นะ/สิ/หรอ) - these will be added later by the app
4. ALWAYS include pronouns (phom/chan) in pronunciation when the Thai text contains ผม/ฉัน/ดิฉัน
5. Provide gendered variations where appropriate (pronouns, certain vocabulary)
6. Avoid overly formal or outdated expressions unless specifically requested
7. Prioritize frequency and usefulness in daily conversations
8. Examples must use the EXACT phrase being taught with complete contextual sentences

### TONE AND STYLE: ${toneDescription}

IMPORTANT: This tone level applies to:
- The selection and variety of vocabulary/phrases
- The contexts and situations where phrases are used
- The example sentences and their settings
- For levels 5+: The absurdity and unusualness of scenarios
- For levels 7+: The ridiculousness of combinations and contexts
- For levels 9+: Complete chaos in phrase selection

This tone level does NOT apply to:
- Mnemonics (ALWAYS create practical, effective memory aids based on sound similarities)
- Pronunciation guides (ALWAYS accurate and clear)
- Translations (ALWAYS correct and appropriate)
- Grammar explanations (ALWAYS helpful and clear)

### MNEMONIC CREATION RULES:
Regardless of tone level, ALWAYS create mnemonics that:
1. Focus on sound similarities between Thai pronunciation and English words
2. Are practical and easy to remember
3. Help with memorization through logical connections
4. Are clear and effective learning tools
5. NEVER include gender-specific pronouns (chan/pom/dichan) in the mnemonic itself
6. NEVER include politeness particles (ka/krap/krub) in the mnemonic
7. For phrases with pronouns, focus on OTHER key words in the phrase
8. Must relate to the meaning while sounding like the pronunciation

Good examples:
- "ขอบคุณ (khob khun)" → "Think: 'Cop coon' - cop saying thanks"
- "อยากไป (yàak pai)" → "Think: 'Yak pie' - yak wants pie (go)"
- "ที่ไหน (thîi nǎi)" → "Think: 'Tea nigh' - tea at night where?"

Bad examples to AVOID:
- "ผมอยากไป" → "Think: 'pom yàak...'" ❌ (contains pronoun)
- "สวัสดีครับ" → "Think: '...krap'" ❌ (contains particle)
- "Think: 'create your own sound'" ❌ (placeholder text)
- Just repeating the pronunciation ❌ (not creative)

### CULTURAL AWARENESS:
- Respect Thai cultural sensitivities and hierarchies
- Include appropriate register shifts (formal/informal) where relevant
- Acknowledge Thai communication patterns (indirect communication, saving face, etc.)
- Use authentic colloquialisms and modern slang where appropriate to the level

### GENDERED SPEECH:
For all phrases and examples, provide variations for:
- Male speakers (using ผม and masculine vocabulary where applicable)
- Female speakers (using ฉัน/ดิฉัน and feminine vocabulary where applicable)
- DO NOT include ครับ/ค่ะ endings - these will be handled by the app

The response must be valid JSON matching the specified format exactly.`;
}

export function generateUserPrompt(options: GeneratePromptOptions): string {
  const { level, specificTopics, count, existingPhrases = [], topicsToDiscuss, toneLevel } = options;
  
  const contextualTopics = topicsToDiscuss || specificTopics || 'general daily conversation';
  const existingContext = existingPhrases.length > 0 
    ? `\n\nAvoid these phrases that have already been generated: ${existingPhrases.join(', ')}`
    : '';

  const levelDescriptions: Record<string, string> = {
    'Complete Beginner': 'Single words and very basic phrases. Focus on essential nouns, common verbs, basic greetings. Maximum 3-4 words per phrase. Use simple, concrete vocabulary with clear pronunciation.',
    'Basic Understanding': 'Short, practical phrases (4-7 words). Common expressions for daily needs: ordering food, asking directions, basic shopping. Include polite particles and simple sentence structures.',
    'Intermediate': 'Complete sentences (6-12 words) covering everyday situations. Natural conversational phrases, common idioms, expressing opinions and feelings. Mix formal and informal registers.',
    'Advanced': 'Complex, nuanced expressions (8-15 words). Sophisticated vocabulary, cultural references, subtle emotional expressions, advanced grammar structures. Include colloquialisms and context-dependent phrases.',
    'Native/Fluent': 'Natural, idiomatic Thai as natives speak it. Full range of registers, slang, cultural expressions, humor, wordplay. Include phrases that would challenge even advanced learners.',
    'God Mode': 'Peak linguistic mastery. Rare expressions, classical references, specialized terminology, regional dialects, archaic forms. Phrases that demonstrate deep cultural and linguistic knowledge.'
  };

  const levelInstruction = levelDescriptions[level] || levelDescriptions['Intermediate'];

  return `Generate EXACTLY ${count} Thai vocabulary items for ${level} learners.

### LEVEL REQUIREMENTS:
${levelInstruction}

### TOPIC FOCUS:
Create phrases specifically related to: ${contextualTopics}${toneLevel && toneLevel >= 7 ? ' (BUT MAKE IT WEIRD AND ABSURD!)' : toneLevel && toneLevel >= 5 ? ' (with funny twists!)' : ''}

${toneLevel && toneLevel >= 9 ? 'CRITICAL INSTRUCTION: This is MAXIMUM ABSURDITY mode! The scenarios should be COMPLETELY NONSENSICAL and SURREAL. Mix normal Thai phrases with the most RIDICULOUS and IMPOSSIBLE situations you can imagine. Think Salvador Dali meets language learning!\n\n' : toneLevel && toneLevel >= 7 ? 'IMPORTANT: Make the scenarios VERY WEIRD and ABSURD. The Thai should be correct but the situations should be BIZARRE!\n\n' : toneLevel && toneLevel >= 5 ? 'NOTE: Add humor and absurdity to make learning fun and memorable!\n\n' : ''}Make the phrases progressively more challenging within the set while staying appropriate for the ${level} level.${existingContext}

### REQUIRED OUTPUT FORMAT:
Return a JSON object with this EXACT structure:
{
  "phrases": [
    {
      "english": "English phrase/word",
      "thai": "Thai translation in Thai script",
      "thaiMasculine": "Thai with masculine forms/particles",
      "thaiFeminine": "Thai with feminine forms/particles", 
      "pronunciation": "Phonetic pronunciation (romanized)",
      "mnemonic": "Practical memory aid based on sound similarities (e.g., 'sawatdee' → 'So what, Dee?')",
      "literal": "Word-by-word literal translation (e.g., 'ไม่เป็นไร' → 'Not become thing')",
      "examples": [
        {
          "thai": "Complete Thai sentence using the phrase",
          "thaiMasculine": "Same sentence with masculine forms",
          "thaiFeminine": "Same sentence with feminine forms",
          "pronunciation": "Full sentence pronunciation", 
          "translation": "English translation of the example"
        },
        // Second example with different context
      ]
    }
    // ... remaining phrases
  ],
  "metadata": {
    "setTheme": "Cohesive theme connecting all phrases",
    "culturalNotes": ["Relevant cultural insights"],
    "difficultyProgression": "How phrases increase in complexity"
  }
}

CRITICAL: You MUST generate EXACTLY ${count} phrases. The response must be valid JSON with no additional text.`;
}

export function createPromptConfig(
  model: string,
  options: GeneratePromptOptions
): PromptConfig {
  const toneLabel = getToneLabel(options.toneLevel || 5);
  const toneDescription = getToneDescription(options.toneLevel || 5, toneLabel);
  const systemPrompt = generateSystemPrompt(toneDescription);
  const userPrompt = generateUserPrompt(options);

  return {
    model,
    level: options.level,
    context: options.specificTopics || options.topicsToDiscuss || 'general',
    toneDescription,
    count: options.count,
    systemPrompt,
    userPrompt
  };
}

function getToneDescription(toneLevel: number, toneLabel: string): string {
  const toneDescriptions: Record<number, string> = {
    1: "Ultra-professional and academic. Select formal vocabulary, technical terminology, and business/academic contexts. Focus on workplace, university, and official situations. Everything should be serious and practical.",
    2: "Professional but approachable. Choose standard vocabulary with workplace and educational contexts. Include polite social interactions and formal settings. Still entirely practical and useful.",
    3: "Balanced and conversational. Mix everyday phrases with practical situations. Cover daily life, shopping, travel, and common social interactions. Maybe add a tiny bit of humor but keep it practical.",
    4: "Friendly and casual with light humor. Use common colloquial phrases with some funny contexts. Include amusing but still useful scenarios like ordering spicy food or haggling at markets.",
    5: "Getting weird now! Mix useful phrases with ABSURD scenarios. Teach real Thai but in ridiculous contexts: 'I need to buy a ladder to rescue my cat from a UFO', 'My elephant ate my homework', 'Can you help me find my invisible friend?'",
    6: "Definitely too much! Create BIZARRE combinations: 'The purple monkey wants to borrow your time machine', 'I accidentally married a durian', 'My goldfish is teaching quantum physics'. Real Thai words in INSANE contexts.",
    7: "Complete madness! Teach phrases for IMPOSSIBLE scenarios: 'How do I politely decline when a ghost invites me to dinner?', 'My refrigerator is plotting against me', 'I need directions to the upside-down dimension'.",
    8: "Absolutely unhinged! Mix normal words in CHAOTIC ways: 'The Tuesday is very loud today', 'I like to wear my thoughts on Wednesdays', 'Can you smell the color blue?'. Grammatically correct Thai expressing NONSENSE.",
    9: "Reality has left the building! Create SURREAL word soups: 'My shoes are having an existential crisis in the microwave', 'The number seven tastes like yesterday', 'I need to return this rented emotion'. Maximum absurdity while teaching real Thai structure.",
    10: "GLITCHED DONKEY MODE ACTIVATED! 🐴💥 Complete linguistic anarchy: 'My grandmother is a Wi-Fi password', 'I breathe mathematics for breakfast', 'The concept of Thursday is stuck in my teeth', 'Help! My shadow has opinions!'. Mix ancient proverbs with internet slang in IMPOSSIBLE ways. The phrases should make ZERO logical sense but still teach real Thai grammar and vocabulary."
  };

  return `${toneLabel}: ${toneDescriptions[toneLevel] || toneDescriptions[5]}`;
} 