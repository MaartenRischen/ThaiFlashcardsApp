// Import INITIAL_PHRASES from app/data/phrases 
import { INITIAL_PHRASES } from '@/app/data/phrases';

// Define types for the generator
export interface Phrase {
  id?: string; // Optional ID, populated from DB
  english: string;
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  mnemonic?: string;
  examples?: ExampleSentence[];
  difficulty?: 'easy' | 'good' | 'hard';
}

export interface ExampleSentence {
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  translation: string;
}

export interface GeneratePromptOptions {
  level: 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';
  specificTopics?: string;
  count: number;
  existingPhrases?: string[];
  topicsToDiscuss?: string;
  tone?: number; // 1-10 scale, where 1 is most serious and 10 is most absurd
}

// Define structured error types for better error handling
export type BatchErrorType = 'API' | 'PARSE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN';

export interface BatchError {
  type: BatchErrorType;
  message: string;
  details?: unknown; // Use unknown instead of any
  timestamp: string;
}

export interface GenerationResult {
  phrases: Phrase[];
  cleverTitle?: string;
  aggregatedErrors: (BatchError & { batchIndex: number })[];
  // Include summary data for client
  errorSummary?: {
    errorTypes: BatchErrorType[];
    totalErrors: number;
    userMessage: string;
  };
  llmBrand?: string;
  llmModel?: string;
  imageUrl?: string;
}

export interface CustomSet {
  name: string;
  level: string;
  specificTopics?: string;
  createdAt: string;
  phrases: Phrase[];
  mnemonics: {[key: number]: string};
  seriousness?: number;
}

// Configuration constants
const MAX_RETRIES = 3;
const BATCH_SIZE = 8;

// Prioritized list of text models for set generation
const TEXT_MODELS = [
  'google/gemini-2.5-pro-preview-03-25', // Gemini 2.5 Pro Preview
  'openai/gpt-4',          // OpenAI GPT-4
  'openai/gpt-3.5-turbo',  // OpenAI GPT-3.5 Turbo
  'anthropic/claude-3-opus', // Anthropic Claude
  'mistralai/mixtral-8x7b', // Other fallback
];

/**
 * Builds a significantly updated prompt for generating Thai flashcards based on detailed user preferences.
 */
function buildGenerationPrompt(
  _topic: string, // Renamed from topic
  options: GeneratePromptOptions,
  existingPhrases: string[] = []
): string {
  const {
    specificTopics,
    count,
    topicsToDiscuss,
    tone = 5, // Default to level 5 (balanced)
  } = options;

  // Define the output schema (remains the same)
  // Use escaped backticks for the schema description
  const schemaDescription = `
  **Output Format:**
  Generate a JSON object containing two keys: "cleverTitle" and "phrases".
  - "cleverTitle": Write a single, natural, matter-of-fact, grammatically correct English sentence that describes the set. Use the user's situations and specific focus, but do NOT just list them. The title should sound like a native English speaker describing what the set is about. Do not use awkward connectors or forced structure. Do not use title case—use normal sentence case. Do NOT include any names, usernames, language, or country. Do NOT use the phrase 'AI Set:' or anything similar. Never use names or the username in the title. Examples:
    - Situations: "learning the guitar, walking to school", Specific Focus: "mustard" → "Learning the guitar and walking to school while thinking about mustard."
    - Situations: "talking to christians", Specific Focus: "cats" → "Talking to christians about cats."
    - Situations: "talking to christians, looking up something in the dictionary", Specific Focus: "cats" → "Looking up something in the dictionary and talking to christians about cats."
    - Situations: "talking to christians" (no specific focus) → "Talking to christians."
    - Specific Focus: "cats" (no situations) → "All about cats."
  - "phrases": An array containing exactly ${count} unique flashcard objects. Each phrase object MUST conform to the following TypeScript interface:

  \`\`\`typescript
  interface Phrase {
    english: string; // Concise English translation.
    thai: string; // Thai script (base form).
    thaiMasculine: string; // Polite male version ("ครับ").
    thaiFeminine: string; // Polite female version ("ค่ะ").
    pronunciation: string; // Simple phonetic guide (e.g., 'sa-wat-dee krap').
    mnemonic?: string; // Provide a concise, intuitive mnemonic in *English* that helps remember the Thai word or short phrase by (1) using English words that sound phonetically similar to the Thai and (2) hinting at its meaning. NEVER reference the user‑provided situations or specific focus. If the Thai entry is longer than three words, pick the single most important word and give a mnemonic for *that* word only. Do not attempt humour or cleverness—prioritise recall effectiveness. Avoid nonsense syllables: only real English words or common sounds.
    examples?: ExampleSentence[]; // 1-2 example sentences reflecting the TONE and LEVEL.
  }

  interface ExampleSentence {
    thai: string; // Example sentence in Thai script.
    thaiMasculine: string; // Polite male version.
    thaiFeminine: string; // Polite female version.
    pronunciation: string; // Phonetic pronunciation.
    translation: string; // English translation.
  }
  \`\`\`

  Ensure the entire response is ONLY the JSON object, starting with '{' and ending with '}'. Do not include any introductory text, explanations, or markdown formatting outside the JSON structure itself.
  `;

  // Construct the detailed main prompt content using a standard template literal
  const prompt = `
  You are an expert AI assistant specialized in creating language learning flashcards. Your task is to generate ${count} flashcards and a set title.

  - For the set title ("cleverTitle"), write a single, natural, matter-of-fact, grammatically correct English sentence that describes the set. Use the user's situations and specific focus, but do NOT just list them. The title should sound like a native English speaker describing what the set is about. Do not use awkward connectors or forced structure. Do not use title case—use normal sentence case. Do NOT include any names, usernames, language, or country. Do NOT use the phrase 'AI Set:' or anything similar. Never use names or the username in the title.
  - Examples:
    - Situations: "learning the guitar, walking to school", Specific Focus: "mustard" → "Learning the guitar and walking to school while thinking about mustard."
    - Situations: "talking to christians", Specific Focus: "cats" → "Talking to christians about cats."
    - Situations: "talking to christians, looking up something in the dictionary", Specific Focus: "cats" → "Looking up something in the dictionary and talking to christians about cats."
    - Situations: "talking to christians" (no specific focus) → "Talking to christians."
    - Specific Focus: "cats" (no situations) → "All about cats."

  **User Preferences:**
  - Situations for Use: ${topicsToDiscuss || 'General conversation'}
  ${specificTopics ? `- Specific Focus: ${specificTopics}` : ''}
  - **TONE: ${tone.toString()}**

  **CRITICAL INSTRUCTIONS:**

  1.  **Set Title:** Follow the above instructions for the set title. Make sure it is a single, natural, grammatically correct English sentence. Do NOT try to be clever or funny. Do NOT include any names, usernames, language, or country. Do NOT use the phrase 'AI Set:' or anything similar. Never use names or the username in the title.

  2.  **Level-Specific Content:** (Ensure strict adherence)
      *   Complete Beginner: Use only the most essential, high-frequency words and very short descriptive phrases (1-3 words). Avoid sentences except for the simplest descriptive S-V-O (subject-verb-object) forms. NO dialogues or questions. Examples should be extremely simple descriptive statements, suitable for someone with zero prior knowledge.
      *   Basic Understanding: Use short, practical descriptive phrases and very simple statements (up to 5 words). Introduce basic grammar and common expressions. NO dialogues, questions, or conversational phrases. Examples should be easy to follow descriptive statements about daily life.
      *   Intermediate: Use descriptive sentences (5-10 words), common grammar structures, and typical phrases. NO dialogues or questions. Examples should describe everyday situations and introduce some variety in structure and vocabulary.
      *   Advanced: Use only complex descriptive sentences (10+ words), nuanced vocabulary, and varied grammar. Do NOT use simple phrases, dialogues, or questions. Examples should be sophisticated descriptive statements.
      *   Native/Fluent: Use idiomatic, natural, and authentic descriptive language as used by educated native speakers. Include slang and cultural references, but NO dialogues or questions. Examples should be descriptive statements that sound like real, fluent Thai.
      *   God Mode: Use extremely elaborate, idiomatic, and sophisticated descriptive language. Phrases and examples should be more complex than those for native speakers, featuring rare vocabulary and advanced grammar in descriptive statements. NO dialogues or questions. Push the boundaries of complexity and naturalness in descriptive language.

  3.  **TONE Implementation (${tone.toString()}):** THIS IS PARAMOUNT. The tone MUST heavily influence ALL content, but NEVER use dialogues or questions. Use the following style guide based on the selected tone level (1-10):

      *   **Levels 1-4 (Practical Base with Increasing Humor):**
          - Level 1: 100% dead serious descriptive statements. No humor whatsoever. Pure business and survival Thai in statement form.
          - Level 2: 95% serious descriptive statements with 5% very mild humor. Like level 1 but occasionally a small smile might escape.
          - Level 3: 85% practical descriptive statements with 15% humor. Starting to have fun but still very much focused on learning.
          - Level 4: 70% practical descriptive statements with 30% humor. The last level where learning is still the main priority.

      *   **Levels 5-7 (Decreasing Practicality):**
          - Level 5: 50% practical descriptive statements, 50% absurd statements. Learning is optional. Examples describe impossible scenarios.
          - Level 6: 30% practical descriptive statements, 70% weird statements. Phrases might still be useful but in contexts that make no sense.
          - Level 7: 15% practical descriptive statements, 85% bizarre statements. You might learn something by accident, but that's not the point anymore.

      *   **Levels 8-10 (Pure WTF Territory):**
          - Level 8: 5% practical descriptive statements, 95% insanity. Examples should make readers question their reality.
          - Level 9: 1% practical descriptive statements, 99% chaos. Should trigger existential crises in readers.
          - Level 10: 0% practical descriptive statements, 100% brain-melting madness. Maximum surrealism. Should make Dali paintings look normal.

      *   **Content Guidelines by Component:**
          - **Main Phrases:** 
            * Levels 1-4: Must be actually useful Thai descriptive phrases, NO dialogues or questions
            * Levels 5-7: Can be real descriptive phrases in completely wrong contexts
            * Levels 8-10: Can be grammatically correct but semantically insane descriptive statements

          - **Example Sentences:** 
            * Levels 1-4: Progress from textbook descriptive examples to slightly amusing situations, NO dialogues
            * Levels 5-7: Start breaking laws of physics and logic in descriptive statements
            * Levels 8-10: Should read like fever dreams written by an AI on LSD, but still in statement form

          - **Mnemonics:** 
            * Levels 1-4: Focus on memorability with increasing creativity
            * Levels 5-7: Can be bizarre but should somehow still help memory
            * Levels 8-10: Pure chaos that accidentally might help remember

      *   **Example Outputs by Level:**
          - Level 1 (Dead Serious):
            * Phrase: "กาแฟร้อนหนึ่งแก้ว" (One hot coffee)
            * Example: "กาแฟร้อนอยู่บนโต๊ะ" (The hot coffee is on the table)
            * Mnemonic: "Cafe" sounds like "กาแฟ" - both mean coffee

          - Level 3 (Fun but Practical):
            * Phrase: "แมวตัวอ้วน" (Fat cat)
            * Example: "แมวตัวอ้วนนอนอยู่บนโซฟาสีชมพู" (The fat cat is sleeping on the pink sofa)
            * Mnemonic: Think of Garfield lounging around

          - Level 5 (50/50):
            * Phrase: "ดวงอาทิตย์สีม่วง" (Purple sun)
            * Example: "ดวงอาทิตย์สีม่วงส่องแสงลงบนต้นไม้ที่ทำจากช็อกโกแลต" (The purple sun shines down on trees made of chocolate)
            * Mnemonic: Imagine a purple sun melting chocolate trees

          - Level 8 (Pure Chaos):
            * Phrase: "สมองกินพิซซ่า" (Brain eating pizza)
            * Example: "สมองที่มีขาเต้นรำกำลังกินพิซซ่าในอวกาศที่ทำจากความฝัน" (The dancing brain with legs is eating pizza in space made of dreams)
            * Mnemonic: Picture your brain growing legs and moonwalking while eating pizza in zero gravity

      *   **Key Rules:**
          - Level 1 must be absolutely serious and practical
          - Levels 2-4 maintain practicality while adding touches of humor
          - Levels 5-7 sacrifice practicality for increasing absurdity
          - Levels 8-10 should make readers question their sanity
          - ALL levels must maintain perfect Thai grammar
          - Higher levels should feel like they were generated by an AI having an existential crisis

  4.  **Topic/Situation Control:**
      *   Focus content *primarily* on the 'Situations for Use': ${topicsToDiscuss || 'General conversation'}. Use this as inspiration, especially for absurd examples.
      *   If 'Specific Focus' (${specificTopics || 'None'}) provided, try to incorporate it.

  5.  **Avoid Duplicates:** Do not generate for these existing English phrases: ${existingPhrases && existingPhrases.length > 0 ? existingPhrases.join(', ') : 'None'}

  ${schemaDescription}
  `;

  return prompt.trim();
}

/**
 * Validates a phrase object to ensure it follows the correct structure
 */
function validatePhrase(data: unknown): data is Phrase {
  if (!data || typeof data !== 'object') return false;
  
  // Use type assertions carefully after checking existence
  const phraseData = data as Partial<Phrase>;

  const hasRequiredFields =
    typeof phraseData.english === 'string' && phraseData.english.trim() !== '' &&
    typeof phraseData.thai === 'string' && phraseData.thai.trim() !== '' &&
    typeof phraseData.thaiMasculine === 'string' && phraseData.thaiMasculine.trim() !== '' &&
    typeof phraseData.thaiFeminine === 'string' && phraseData.thaiFeminine.trim() !== '' &&
    typeof phraseData.pronunciation === 'string' && phraseData.pronunciation.trim() !== '';

  if (!hasRequiredFields) return false;

  // At this point we know these fields exist and are non-empty strings
  const thai = phraseData.thai as string;
  const pronunciation = phraseData.pronunciation as string;
  const english = phraseData.english as string;

  // Enhanced mnemonic validation
  if (phraseData.mnemonic !== undefined && phraseData.mnemonic !== null) {
    // Basic type check
    if (typeof phraseData.mnemonic !== 'string') return false;
    if (phraseData.mnemonic === '') {
      phraseData.mnemonic = undefined;
    } else {
      // Validate mnemonic content
      const mnemonic = phraseData.mnemonic.toLowerCase();
      
      // Check if mnemonic contains any reference to the Thai word's pronunciation
      const pronunciationParts = pronunciation.toLowerCase().split(/[-\s]+/);
      const hasPhoneticReference = pronunciationParts.some(part => 
        mnemonic.includes(part) || 
        // Check for similar sounds (basic phonetic matching)
        mnemonic.includes(part.replace(/[aeiou]/g, ''))
      );
      
      // Check if mnemonic references the meaning
      const meaningWords = english.toLowerCase().split(/\s+/);
      const hasMeaningReference = meaningWords.some(word => 
        mnemonic.includes(word) ||
        // Check for word stems
        (word.length > 4 && mnemonic.includes(word.slice(0, -2)))
      );
      
      // Reject if mnemonic doesn't help with either pronunciation or meaning
      if (!hasPhoneticReference && !hasMeaningReference) {
        console.warn(`Invalid mnemonic for "${thai}" (${english}): "${phraseData.mnemonic}"`);
        phraseData.mnemonic = undefined; // Clear invalid mnemonic
      }
    }
  }

  // Validate examples if present
  if (phraseData.examples !== undefined && phraseData.examples !== null) {
    if (!Array.isArray(phraseData.examples)) return false;
    
    // Validate each example sentence
    for (const ex of phraseData.examples) {
      // Cast ex to unknown first for safety
      const exampleData = ex as unknown;
      if (!exampleData || typeof exampleData !== 'object') return false;
      const example = exampleData as Partial<ExampleSentence>;

      if (typeof example.thai !== 'string' || example.thai.trim() === '' ||
          typeof example.thaiMasculine !== 'string' || example.thaiMasculine.trim() === '' ||
          typeof example.thaiFeminine !== 'string' || example.thaiFeminine.trim() === '' ||
          typeof example.pronunciation !== 'string' || example.pronunciation.trim() === '' ||
          typeof example.translation !== 'string' || example.translation.trim() === '') {
        console.warn("Invalid example structure:", ex);
        return false;
      }
    }
  }

  return true;
}

/**
 * Creates a BatchError object with the specified type and message
 */
function createBatchError(
  type: BatchErrorType, 
  message: string, 
  details?: unknown
): BatchError {
  return {
    type,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Main function to generate a complete custom flashcard set
 * Updated to handle cleverTitle generation
 */
export async function generateCustomSet(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  totalCount: number,
  onProgressUpdate?: (progress: { completed: number, total: number, latestPhrases?: Phrase[] }) => void
): Promise<GenerationResult> {
  try {
    // Initialize progress right away
    if (onProgressUpdate) {
      onProgressUpdate({ completed: 0, total: totalCount });
    }
    
    console.log(`Starting card generation (OpenRouter): ${totalCount} total cards requested with preferences:`, preferences);
    
    // Define our batch size
    const batchSize = BATCH_SIZE;
    const batchesNeeded = Math.ceil(totalCount / batchSize);
    
    const aggregatedErrors: (BatchError & { batchIndex: number })[] = [];
    const allPhrases: Phrase[] = [];
    let cleverTitle: string | undefined;
    
    // Prepare the fallback data early so it's ready if needed
    const fallbackPhrases = INITIAL_PHRASES.slice(0, totalCount);

    // Loop through batches
    for (let i = 0; i < batchesNeeded; i++) {
      try {
        // Update progress immediately with batch attempt
        if (onProgressUpdate) {
          onProgressUpdate({ 
            completed: allPhrases.length, 
            total: totalCount,
            latestPhrases: allPhrases.slice(-3)
          });
        }
        
        // Calculate how many phrases we still need
        const remaining = totalCount - allPhrases.length;
        const countForBatch = Math.min(remaining, batchSize);
        
        // If we already have enough phrases, break early
        if (remaining <= 0) break;
        
        // Build prompt for this batch
        const existingPhrasesMeanings = allPhrases.map(p => p.english);
        const prompt = buildGenerationPrompt("", {
          ...preferences,
          count: countForBatch,
          existingPhrases: existingPhrasesMeanings,
        });
        
        // Generate batch
        let retries = 0;
        let batchResult: { phrases: Phrase[], cleverTitle?: string, error?: BatchError } | null = null;
        
        // Try OpenRouter models first
        while (retries < MAX_RETRIES) {
          try {
            batchResult = await generateOpenRouterBatch(
              prompt, 
              TEXT_MODELS,
              i
            );
            
            // If got results, break out of retry loop
            if (batchResult.phrases.length > 0 || !batchResult.error) {
              break;
            } 
            
            // Got an error but still want to retry
            console.error(`Batch ${i} attempt ${retries + 1} failed: ${batchResult.error?.message}`);
            retries++;
            
            // Short pause before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          } catch (error) {
            console.error(`Unexpected error in batch ${i} attempt ${retries + 1}:`, error);
            retries++;
            
            // Short pause before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        }
        
        // Process batch results
        if (batchResult) {
          // Save clever title from first batch if available
          if (i === 0 && batchResult.cleverTitle) {
            cleverTitle = batchResult.cleverTitle;
          }
          
          // Add phrases to our collection
          if (batchResult.phrases.length > 0) {
            allPhrases.push(...batchResult.phrases);
          }
          
          // Store any errors
          if (batchResult.error) {
            aggregatedErrors.push({
              ...batchResult.error,
              batchIndex: i
            });
            
            // Log batch failure after retries
            if (retries >= MAX_RETRIES) {
              console.error(`Batch ${i} failed after ${retries} retries. Aborting further generation.`);
            }
          }
        }
        
        // Update progress after batch completion
        if (onProgressUpdate) {
          // Calculate completion based on phrases successfully generated
          const progressPercentage = Math.min(
            Math.floor((allPhrases.length / totalCount) * 100), 
            100
          );
          
          // Update with the completed batch results
          onProgressUpdate({ 
            completed: allPhrases.length, 
            total: totalCount,
            latestPhrases: batchResult?.phrases || []
          });
          
          console.log(`Batch ${i} complete. Progress: ${progressPercentage}% (${allPhrases.length}/${totalCount} cards)`);
        }
      } catch (error) {
        console.error(`Fatal error processing batch ${i}:`, error);
        const batchError: BatchError = createBatchError(
          'UNKNOWN', 
          `Unhandled error in batch ${i}: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        );
        
        aggregatedErrors.push({
          ...batchError,
          batchIndex: i,
        });
      }
    }
    
    // Check if we need to use fallback
    if (allPhrases.length === 0 && fallbackPhrases.length > 0) {
      console.log("No phrases generated. Using fallback data.");
      allPhrases.push(...fallbackPhrases);
      
      // Update progress one last time with fallback data
      if (onProgressUpdate) {
        onProgressUpdate({ 
          completed: allPhrases.length, 
          total: totalCount,
          latestPhrases: allPhrases.slice(-3)
        });
      }
    } else if (allPhrases.length < totalCount) {
      // We got some phrases but not enough - pad with fallback
      const shortfall = totalCount - allPhrases.length;
      if (shortfall > 0 && fallbackPhrases.length > 0) {
        console.log(`Generated only ${allPhrases.length} of ${totalCount} phrases. Adding ${shortfall} fallback phrases.`);
        allPhrases.push(...fallbackPhrases.slice(0, shortfall));
      }
    }
    
    // Prepare final error summary if needed
    let errorSummary: GenerationResult['errorSummary'] | undefined;
    if (aggregatedErrors.length > 0) {
      const errorTypes = Array.from(new Set(aggregatedErrors.map(e => e.type)));
      
      errorSummary = {
        errorTypes,
        totalErrors: aggregatedErrors.length,
        userMessage: `Set generation encountered ${aggregatedErrors.length} errors.`
      };
    }
    
    // Final result
    const result: GenerationResult = {
      phrases: allPhrases,
      cleverTitle,
      aggregatedErrors,
      errorSummary,
      llmBrand: 'OpenRouter',
      llmModel: TEXT_MODELS[0], // Record the primary model
    };
    
    return result;
  } catch (error) {
    console.error("Unhandled error in generateCustomSet:", error);
    return {
      phrases: [],
      aggregatedErrors: [{
        ...createBatchError(
          'UNKNOWN',
          `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
          { error }
        ),
        batchIndex: -1,
      }],
      errorSummary: {
        errorTypes: ['UNKNOWN'],
        totalErrors: 1,
        userMessage: 'An unexpected error occurred during set generation.'
      }
    };
  }
}

/**
 * Creates a partial CustomSet object from generated phrases
 * (Mnemonics are handled separately)
 */
export function createCustomSet(
  name: string, 
  level: string, 
  specificTopics: string | undefined, 
  phrases: Phrase[],
  seriousness?: number // Optional
): Omit<CustomSet, 'mnemonics' | 'goals'> { // goals likely doesn't belong here
  return {
    name,
    level,
    specificTopics,
    createdAt: new Date().toISOString(),
    phrases,
    seriousness
  };
}

/**
 * Generates a single flashcard (useful for regenerating a specific card)
 * Enhanced with better error handling
 */
export async function generateSingleFlashcard(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  targetEnglishMeaning?: string
): Promise<{ phrase: Phrase | null, error?: BatchError }> {
  try {
    console.log(`Generating single flashcard with preferences:`, JSON.stringify(preferences));
    if (targetEnglishMeaning) {
      console.log(`Target English meaning for single card: ${targetEnglishMeaning}`);
    }
    
    const prompt = buildGenerationPrompt(preferences.specificTopics || '', {
      ...preferences,
      count: 1,
      existingPhrases: targetEnglishMeaning ? undefined : []
    }, targetEnglishMeaning ? [targetEnglishMeaning] : []);

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        console.log(`Single card generation attempt ${retries + 1}/${MAX_RETRIES}`);
        const result = await generateOpenRouterBatch(prompt, TEXT_MODELS, -1);
        
        if (result.error) {
          console.error(`Error generating single flashcard (attempt ${retries + 1}, type ${result.error.type}):`, result.error.message);
          retries++;
          
          if (!['NETWORK', 'API', 'UNKNOWN'].includes(result.error.type) || retries >= MAX_RETRIES) {
             console.error(`Max retries reached or non-retryable error (${result.error.type}) for single card.`);
             return { phrase: null, error: result.error };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        if (result.phrases.length > 0) {
          console.log(`Successfully generated single card: ${result.phrases[0].english}`);
          return { phrase: result.phrases[0] };
        }
        
        retries++;
        console.warn(`API succeeded but returned 0 phrases for single card generation (attempt ${retries})`);
        if (retries >= MAX_RETRIES) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));

      } catch (error: unknown) {
        retries++;
        console.error(`Uncaught error in single card generation (attempt ${retries}):`, error);
        if (retries >= MAX_RETRIES) {
          return { 
            phrase: null, 
            error: createBatchError('UNKNOWN', `Uncaught error generating single card: ${error instanceof Error ? error.message : String(error)}`, { error })
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    console.error('Failed to generate single flashcard after multiple attempts.');
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', 'Failed to generate single flashcard after multiple attempts (e.g., API consistently returned 0 phrases).', {})
    };

  } catch (error: unknown) {
    console.error("Unexpected error setting up generateSingleFlashcard:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', `Unexpected setup error in generateSingleFlashcard: ${errorMessage}`, { error })
    };
  }
}

// Utility to map seriousnessLevel (ridiculousness) to temperature
function getTemperatureFromSeriousness(toneLevel: number | undefined): number {
  // Default to level 5 (balanced) if undefined
  const level = toneLevel ?? 5;
  
  // Clamp the level between 1 and 10
  const clampedLevel = Math.max(1, Math.min(10, level));
  
  // Create a more extreme non-linear progression:
  // Level 1: 0.1 (extremely conservative - textbook perfect)
  // Level 2-4: 0.3-0.5 (gradually allowing mild creativity)
  // Level 5-7: 0.7-0.9 (rapidly increasing chaos)
  // Level 8-10: 0.95-2.0 (maximum chaos, beyond normal bounds)
  
  const temperatureMap: Record<number, number> = {
    1: 0.1,   // Dead serious
    2: 0.3,   // Barely a smile
    3: 0.4,   // Slight humor
    4: 0.5,   // Last practical level
    5: 0.7,   // Starting to get weird
    6: 0.8,   // Definitely weird
    7: 0.9,   // Very weird
    8: 0.95,  // Reality-bending
    9: 1.5,   // Reality-breaking
    10: 2.0   // Maximum possible chaos
  };
  
  return temperatureMap[clampedLevel];
}

// Refactored OpenRouter call with fallback logic and temperature
async function callOpenRouterWithFallback(prompt: string, models: string[], temperature: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Enhanced logging for API key debugging
  if (!apiKey) {
    console.error("CRITICAL ERROR: Missing OPENROUTER_API_KEY environment variable.");
    console.error("Environment context: NODE_ENV =", process.env.NODE_ENV);
    console.error("API Keys available:", {
      "OPENROUTER_API_KEY": process.env.OPENROUTER_API_KEY ? "Defined" : "Undefined",
      "IDEOGRAM_API_KEY": process.env.IDEOGRAM_API_KEY ? "Defined" : "Undefined"
    });
    
    // Return empty JSON to trigger fallback mechanism
    return '{"phrases": [], "cleverTitle": "Sample Phrases"}';
  }
  
  let lastError: string | null = null;
  for (const model of models) {
    try {
      console.log(`Trying OpenRouter model: ${model} with temperature: ${temperature}`);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Thai Flashcards App"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature
        })
      });
      if (!response.ok) {
        const errorStatus = response.status;
        const errorText = await response.text();
        console.error(`OpenRouter API Error (model: ${model}): Status ${errorStatus}, Body: ${errorText}`);
        try {
          const errorJson = JSON.parse(errorText);
          lastError = errorJson.error?.message || errorText;
        } catch {
          lastError = errorText;
        }
        continue;
      }
      const data: unknown = await response.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'choices' in data &&
        Array.isArray(data.choices) &&
        data.choices.length > 0 &&
        typeof data.choices[0] === 'object' &&
        data.choices[0] !== null &&
        'message' in data.choices[0] &&
        typeof data.choices[0].message === 'object' &&
        data.choices[0].message !== null &&
        'content' in data.choices[0].message &&
        typeof data.choices[0].message.content === 'string'
      ) {
        const text = data.choices[0].message.content;
        if (!text) throw new Error("Empty content returned from OpenRouter");
        console.log(`Successfully generated set with model: ${model}`);
        return text;
      } else {
        console.error(`Unexpected OpenRouter response structure for model ${model}:`, data);
        lastError = `Unexpected response structure from ${model}`;
        continue;
      }
    } catch (error) {
      console.error(`Error calling OpenRouter model ${model}:`, error);
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
  }
  throw new Error(lastError || "All OpenRouter models failed for set generation.");
}

// Update batch generator to use fallback logic and temperature
export async function generateOpenRouterBatch(
  prompt: string,
  models: string[],
  batchIndex: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError}> {
  try {
    const temperature = getTemperatureFromSeriousness(undefined);
    const responseText = await callOpenRouterWithFallback(prompt, models, temperature);
    // Clean the response (remove markdown, etc.)
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();
    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return {
        phrases: [],
        error: createBatchError('PARSE', `Failed to parse API response (Batch ${batchIndex}): ${errorMessage}`, { responseText: cleanedText, parseError: String(parseError) })
      };
    }
    if (typeof parsedResponse !== 'object' || parsedResponse === null || !('phrases' in parsedResponse) || !Array.isArray(parsedResponse.phrases)) {
      console.error(`Invalid JSON structure received (Batch ${batchIndex}): Expected { phrases: [...] }, got:`, parsedResponse);
      return {
        phrases: [],
        error: createBatchError('VALIDATION', `Invalid JSON structure received (Batch ${batchIndex}). Expected object with 'phrases' array.`, { parsedResponse })
      };
    }
    const cleverTitle = ('cleverTitle' in parsedResponse && typeof parsedResponse.cleverTitle === 'string') ? parsedResponse.cleverTitle : undefined;
    if ('cleverTitle' in parsedResponse && typeof parsedResponse.cleverTitle !== 'string') {
       console.warn(`Invalid cleverTitle type received (Batch ${batchIndex}), expected string, got ${typeof parsedResponse.cleverTitle}. Ignoring title.`);
    }
    const validatedPhrases: Phrase[] = [];
    const validationErrors: string[] = [];
    for (const phraseData of parsedResponse.phrases) {
      if (validatePhrase(phraseData)) {
         const validatedPhrase = phraseData as Phrase;
         if (validatedPhrase.mnemonic === null) {
            validatedPhrase.mnemonic = undefined;
         }
         validatedPhrases.push(validatedPhrase);
      } else {
        validationErrors.push(`Invalid phrase structure: ${JSON.stringify(phraseData).substring(0, 100)}...`);
      }
    }
    if (validationErrors.length > 0) {
       console.warn(`Validation errors in batch ${batchIndex}:`, validationErrors);
      if (validatedPhrases.length === 0) {
        return {
          phrases: [],
          cleverTitle,
          error: createBatchError('VALIDATION', `All ${parsedResponse.phrases.length} phrases failed validation (Batch ${batchIndex}).`, { errors: validationErrors })
        };
      } else {
        console.warn(`Batch ${batchIndex} completed with ${validationErrors.length} validation errors out of ${parsedResponse.phrases.length} phrases. Returning ${validatedPhrases.length} valid phrases.`);
      }
    }
    if (validatedPhrases.length === 0 && !cleverTitle) {
        return {
            phrases: [],
            error: createBatchError('VALIDATION', `API returned empty or invalid phrases array and no title (Batch ${batchIndex})`, { parsedResponse })
        };
    }
    console.log(`Batch ${batchIndex} successful: Generated ${validatedPhrases.length} valid phrases.${cleverTitle ? ' Title: "' + cleverTitle + '"':''}`);
    return {
      phrases: validatedPhrases,
      cleverTitle
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error in generateOpenRouterBatch (Batch ${batchIndex}):`, error);
    let errorType: BatchErrorType = 'UNKNOWN';
    if (errorMessage.includes('API error')) errorType = 'API';
    else if (errorMessage.includes('network') || errorMessage.includes('fetch')) errorType = 'NETWORK';
    return {
      phrases: [],
      error: createBatchError(errorType, `General error processing batch ${batchIndex}: ${errorMessage}`, { error })
    };
  }
} 