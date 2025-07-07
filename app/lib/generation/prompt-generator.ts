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
3. Include appropriate politeness particles (ครับ/ค่ะ/จ้ะ/จ๊ะ/นะ/สิ/หรอ) based on context
4. Provide gendered variations where appropriate (pronouns, particles, certain vocabulary)
5. Avoid overly formal or outdated expressions unless specifically requested
6. Prioritize frequency and usefulness in daily conversations
7. Mnemonics should be creative, visual, and culturally sensitive
8. Examples must use the EXACT phrase being taught with complete contextual sentences

### TONE AND STYLE: ${toneDescription}

### CULTURAL AWARENESS:
- Respect Thai cultural sensitivities and hierarchies
- Include appropriate register shifts (formal/informal) where relevant
- Acknowledge Thai communication patterns (indirect communication, saving face, etc.)
- Use authentic colloquialisms and modern slang where appropriate to the level

### GENDERED SPEECH:
For all phrases and examples, provide variations for:
- Male speakers (using ครับ, ผม, and masculine vocabulary where applicable)
- Female speakers (using ค่ะ/คะ, ฉัน/ดิฉัน, and feminine vocabulary where applicable)

The response must be valid JSON matching the specified format exactly.`;
}

export function generateUserPrompt(options: GeneratePromptOptions): string {
  const { level, specificTopics, count, existingPhrases = [], topicsToDiscuss } = options;
  
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
Create phrases specifically related to: ${contextualTopics}

Make the phrases progressively more challenging within the set while staying appropriate for the ${level} level.${existingContext}

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
      "mnemonic": "Creative memory aid linking sound/meaning",
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
    1: "Ultra-professional and academic. Use formal vocabulary, technical terminology, and textbook-perfect examples. Suitable for serious academic study or professional contexts.",
    2: "Professional but approachable. Clear, practical vocabulary with standard examples. Perfect for structured learning environments.",
    3: "Balanced and conversational. Mix of practical phrases and interesting examples. Natural but still educational.",
    4: "Friendly and engaging. Use relatable scenarios, mild humor, and memorable examples that make learning enjoyable.",
    5: "Creative and entertaining. Include wordplay, cultural references, and clever mnemonics. Make learning fun without sacrificing usefulness.",
    6: "Playful and quirky. Use unexpected comparisons, gentle humor, and creative scenarios while maintaining educational value.",
    7: "Whimsical and imaginative. Create unusual but memorable associations. Balance creativity with practical application.",
    8: "Absurdist with purpose. Use surreal scenarios and unexpected connections that stick in memory. Still teach real, usable Thai.",
    9: "Wildly creative and unconventional. Push boundaries with bizarre mnemonics and scenarios while teaching genuine phrases.",
    10: "Complete creative chaos. Maximum absurdity, surreal examples, and utterly unexpected associations. For adventurous learners who learn best through the ridiculous."
  };

  return `${toneLabel}: ${toneDescriptions[toneLevel] || toneDescriptions[5]}`;
} 