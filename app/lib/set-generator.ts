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
  level: 'beginner' | 'intermediate' | 'advanced';
  specificTopics?: string;
  count: number;
  existingPhrases?: string[];
  topicsToDiscuss?: string;
  topicsToAvoid?: string;
  seriousnessLevel?: number;
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
    topicsToAvoid,
    seriousnessLevel = 5 // Default to neutral
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
  - Topics to STRICTLY AVOID: ${topicsToAvoid || 'None specified'}
  - **TONE CONTROL: ${seriousnessLevel}% Ridiculous / ${100 - seriousnessLevel}% Serious**

  **CRITICAL INSTRUCTIONS:**

  1.  **Set Title:** Follow the above instructions for the set title. Make sure it is a single, natural, grammatically correct English sentence. Do NOT try to be clever or funny. Do NOT include any names, usernames, language, or country. Do NOT use the phrase 'AI Set:' or anything similar. Never use names or the username in the title.

  2.  **Level-Specific Content:** (Ensure strict adherence)
      *   Beginner: Mostly essential words/short phrases. Simple S-V-O sentences rarely. Simple examples.
      *   Intermediate: Conversational sentences (5-10 words). Common grammar. Phrases ok. Typical examples.
      *   Advanced: ONLY complex sentences (10+ words). Nuanced vocabulary, varied grammar. NO simple phrases. Complex examples.

  3.  **TONE Implementation (${seriousnessLevel}% Ridiculous / ${100 - seriousnessLevel}% Serious):** THIS IS PARAMOUNT. The tone MUST heavily influence ALL content. For high ridiculousness (60%+), the TONE OVERRIDES the literal interpretation of the 'Situations'. Use the situations as a *springboard* for absurdity, don't just generate serious content *about* the situation.
      *   **Style Guide for Ridiculousness:** Think absurdist humor, unexpected juxtapositions, non-sequiturs, bizarre characters/events, and breaking logical expectations are highly encouraged.
      *   **Phrases/Sentences:**
          *   0-10%: Standard, textbook, dry, factual.
          *   20-40%: Mostly serious; occasional mild quirks or unusual phrasing.
          *   50-70%: Noticeably quirky, surreal, or humorously unexpected. Use metaphors, wordplay, odd scenarios. Blend standard vocab with surprising twists.
          *   80-90%: Highly absurd, nonsensical, surreal sentences. Use hyperbole, impossible combinations, illogical situations. Prioritize humor/strangeness over literal meaning, while maintaining grammatical structure for the level.
          *   91-100%: Maximum absurdity. Push boundaries. Generate grammatically plausible sentences that are almost meaningless due to extreme surrealism, non-sequiturs, bizarre tangents. Make it weird, funny, unpredictable. The phrase itself can be nonsensical.
      *   **Mnemonics:**
        * Provide a concise, intuitive mnemonic in *English* that maps the Thai sound to an English word/phrase that sounds similar **and** hints at the meaning.
        * NEVER reference the user‑provided situations or specific focus.
        * If the Thai entry is longer than three words, choose the single most important word and give a mnemonic for *that* word only.
        * Do **not** attempt to be funny or clever—prioritise memory effectiveness.
        * Use only real English words or widely‑recognised sounds; avoid nonsense syllables.
      *   **Example Sentences:** MUST strongly reflect the tone. 
          *   Low Ridiculousness: Practical, standard examples.
          *   Medium Ridiculousness: Mildly amusing or odd situations.
          *   High Ridiculousness (60%+): Create SURREAL or NONSENSICAL scenarios.

  4.  **Topic/Situation Control:**
      *   Focus content *primarily* on the 'Situations for Use': ${topicsToDiscuss || 'General conversation'}. Use this as inspiration, especially for absurd examples.
      *   If 'Specific Focus' (${specificTopics || 'None'}) provided, try to incorporate it.
      *   ABSOLUTELY DO NOT generate content related to 'Topics to STRICTLY AVOID': ${topicsToAvoid || 'None specified'}.

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

  // Optional fields validation
  if (phraseData.mnemonic !== undefined && phraseData.mnemonic !== null && typeof phraseData.mnemonic !== 'string') return false; // Allow null
  if (phraseData.mnemonic === '') phraseData.mnemonic = undefined; // Treat empty string as undefined
  
  if (phraseData.examples !== undefined && phraseData.examples !== null) { // Allow null
    if (!Array.isArray(phraseData.examples)) return false;
    
    // Validate each example sentence
    for (const ex of phraseData.examples) {
      // Cast ex to unknown first for safety
      const exampleData = ex as unknown;
      if (!exampleData || typeof exampleData !== 'object') return false;
      const example = exampleData as Partial<ExampleSentence>; // Cast to partial

      if (typeof example.thai !== 'string' || example.thai.trim() === '' ||
          typeof example.thaiMasculine !== 'string' || example.thaiMasculine.trim() === '' ||
          typeof example.thaiFeminine !== 'string' || example.thaiFeminine.trim() === '' ||
          typeof example.pronunciation !== 'string' || example.pronunciation.trim() === '' ||
          typeof example.translation !== 'string' || example.translation.trim() === '') {
        console.warn("Invalid example structure:", ex);
        return false; // Invalid example sentence structure
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
    let completedBatches = 0;
    
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
              i,
              preferences.seriousnessLevel
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
        completedBatches++;
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
        const result = await generateOpenRouterBatch(prompt, TEXT_MODELS, -1, preferences.seriousnessLevel);
        
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
function getTemperatureFromSeriousness(seriousnessLevel: number | undefined): number {
  if (!seriousnessLevel || seriousnessLevel <= 0) return 0;
  // Map 1-100 to 0.2-1.2 (linear)
  return Math.round((0.2 + (seriousnessLevel / 100) * 1.0) * 100) / 100;
}

// Refactored OpenRouter call with fallback logic and temperature
async function callOpenRouterWithFallback(prompt: string, models: string[], temperature: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Log the error but don't throw immediately - this allows fallback mechanisms to take over faster
    console.error("callOpenRouterWithFallback: Missing OPENROUTER_API_KEY environment variable. This is expected in local environments as we'll fallback to alternative sources.");
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
  batchIndex: number,
  seriousnessLevel?: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError}> {
  try {
    const temperature = getTemperatureFromSeriousness(seriousnessLevel);
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