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
  details?: any; // e.g., status code for API, snippet of text for PARSE
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

// --- Replace Gemini with OpenRouter as default generator ---
// const DEFAULT_OPENROUTER_MODEL = 'openrouter/mixtral-8x7b';
const DEFAULT_OPENROUTER_MODEL = 'openrouter/auto'; // Use Auto Router

/**
 * Builds a significantly updated prompt for generating Thai flashcards based on detailed user preferences.
 */
function buildGenerationPrompt(options: GeneratePromptOptions): string {
  const { 
    level, 
    specificTopics, 
    count, 
    existingPhrases,
    topicsToDiscuss, 
    topicsToAvoid, 
    seriousnessLevel = 50 // Default to 50%
  } = options;

  const seriousness = seriousnessLevel / 100; // Convert to 0.0 - 1.0
  const ridiculousness = 1.0 - seriousness;

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
  let prompt = `
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
function validatePhrase(data: any): data is Phrase {
  if (!data || typeof data !== 'object') return false;
  
  const hasRequiredFields =
    typeof data.english === 'string' && data.english.trim() !== '' &&
    typeof data.thai === 'string' && data.thai.trim() !== '' &&
    typeof data.thaiMasculine === 'string' && data.thaiMasculine.trim() !== '' &&
    typeof data.thaiFeminine === 'string' && data.thaiFeminine.trim() !== '' &&
    typeof data.pronunciation === 'string' && data.pronunciation.trim() !== '';

  if (!hasRequiredFields) return false;

  // Optional fields validation
  if (data.mnemonic !== undefined && data.mnemonic !== null && typeof data.mnemonic !== 'string') return false; // Allow null
  if (data.mnemonic === '') data.mnemonic = undefined; // Treat empty string as undefined
  
  if (data.examples !== undefined && data.examples !== null) { // Allow null
    if (!Array.isArray(data.examples)) return false;
    
    // Validate each example sentence
    for (const ex of data.examples) {
      if (!ex || typeof ex !== 'object' ||
          typeof ex.thai !== 'string' || ex.thai.trim() === '' ||
          typeof ex.thaiMasculine !== 'string' || ex.thaiMasculine.trim() === '' ||
          typeof ex.thaiFeminine !== 'string' || ex.thaiFeminine.trim() === '' ||
          typeof ex.pronunciation !== 'string' || ex.pronunciation.trim() === '' ||
          typeof ex.translation !== 'string' || ex.translation.trim() === '') {
        console.warn("Invalid example structure:", ex); // Log invalid example
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
  details?: any
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
  const allGeneratedPhrases: Phrase[] = [];
  const aggregatedErrors: (BatchError & { batchIndex: number })[] = [];
  let extractedCleverTitle: string | undefined = undefined;
  
  let remainingCount = totalCount;
  let batchIndex = 0;

  console.log(`Starting card generation (OpenRouter): ${totalCount} total cards requested with preferences:`, JSON.stringify(preferences));

  while (remainingCount > 0 && allGeneratedPhrases.length < totalCount) {
    const currentBatchSize = Math.min(remainingCount, BATCH_SIZE);
    const existingEnglish = allGeneratedPhrases.map(p => p.english);
    const prompt = buildGenerationPrompt({
      ...preferences,
      count: currentBatchSize,
      existingPhrases: existingEnglish,
    });

    let retries = 0;
    let success = false;
    let batchAttemptPhrases: Phrase[] = [];
    let batchResult: any = null;
    while (retries < MAX_RETRIES && !success) {
      try {
        batchResult = await generateOpenRouterBatch(prompt, DEFAULT_OPENROUTER_MODEL, batchIndex);
        if (batchResult.error) {
          aggregatedErrors.push({ ...batchResult.error, batchIndex });
          retries++;
          if (retries >= MAX_RETRIES) break;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        success = true;
        if (batchResult.cleverTitle && !extractedCleverTitle) {
          extractedCleverTitle = batchResult.cleverTitle;
        }
        if (batchResult.phrases.length > 0) {
          const newPhrases = batchResult.phrases.filter((p: Phrase) => !allGeneratedPhrases.some(existing => existing.english === p.english));
          allGeneratedPhrases.push(...newPhrases);
          remainingCount -= newPhrases.length;
          batchAttemptPhrases = newPhrases;
        }
      } catch (error: any) {
        retries++;
        aggregatedErrors.push({
          type: 'UNKNOWN', message: `Uncaught error: ${error.message}`,
          details: { error: error.toString(), stack: error.stack },
          timestamp: new Date().toISOString(), batchIndex
        });
        if (retries >= MAX_RETRIES) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    if (!success) {
      console.error(`Batch ${batchIndex} failed after ${MAX_RETRIES} retries. Aborting further generation.`);
      break;
    }
    if (onProgressUpdate) {
      onProgressUpdate({
        completed: allGeneratedPhrases.length,
        total: totalCount,
        latestPhrases: batchAttemptPhrases
      });
    }
    batchIndex++;
  }

  const errorTypes = aggregatedErrors.map(err => err.type).filter((value, index, self) => self.indexOf(value) === index);
  const totalErrors = aggregatedErrors.length;
  let userMessage = '';
  if (totalErrors > 0) {
    if (allGeneratedPhrases.length === 0) {
      userMessage = `Generation failed completely. Issues encountered: ${errorTypes.join(', ')}.`;
    } else if (allGeneratedPhrases.length < totalCount) {
      userMessage = `Finished with some issues (${allGeneratedPhrases.length}/${totalCount} cards created). Problems included: ${errorTypes.join(', ')}.`;
    } else {
      userMessage = `Generation completed, but some minor issues occurred (${errorTypes.join(', ')}).`;
    }
  }
  const errorSummary = totalErrors > 0 ? { errorTypes, totalErrors, userMessage } : undefined;

  return {
    phrases: allGeneratedPhrases,
    cleverTitle: extractedCleverTitle,
    aggregatedErrors,
    errorSummary
  };
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
): Omit<CustomSet, 'mnemonics' | 'goals'> {
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
    
    const prompt = buildGenerationPrompt({
      ...preferences,
      count: 1,
      existingPhrases: targetEnglishMeaning ? undefined : []
    });

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        console.log(`Single card generation attempt ${retries + 1}/${MAX_RETRIES}`);
        const result = await generateOpenRouterBatch(prompt, DEFAULT_OPENROUTER_MODEL, -1);
        
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

      } catch (error: any) {
        retries++;
        console.error(`Uncaught error in single card generation (attempt ${retries}):`, error);
        if (retries >= MAX_RETRIES) {
          return { 
            phrase: null, 
            error: createBatchError('UNKNOWN', `Uncaught error generating single card: ${error.message}`, { error })
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

  } catch (error: any) {
    console.error("Unexpected error setting up generateSingleFlashcard:", error);
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', `Unexpected setup error in generateSingleFlashcard: ${error.message}`, { error })
    };
  }
}

// Add OpenRouter API call
async function callOpenRouter(prompt: string, model: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  // TEMPORARILY HARDCODED - REMOVE LATER
  // const apiKey = "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";

  // Log if the API key is missing *at the point of use*
  if (!apiKey) {
    console.error("callOpenRouter Error: Missing OPENROUTER_API_KEY env variable at runtime.");
    throw new Error("Missing OPENROUTER_API_KEY env variable");
  }

  // Log the first few chars of the key to confirm it's loaded (DO NOT LOG THE FULL KEY)
  console.log(`callOpenRouter: Using OpenRouter API Key starting with: ${apiKey.substring(0, 5)}...`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    })
  });

  if (!response.ok) {
    const errorStatus = response.status;
    const errorText = await response.text();
    // Log the specific error details
    console.error(`OpenRouter API Error: Status ${errorStatus}, Body: ${errorText}`);
    throw new Error(`OpenRouter API error: Status ${errorStatus} - ${errorText}`);
  }

  const data = await response.json();
  // Extract the text from the first choice
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No content returned from OpenRouter");
  return text;
}

// Add OpenRouter batch generator
export async function generateOpenRouterBatch(
  prompt: string,
  model: string,
  batchIndex: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError}> {
  try {
    const responseText = await callOpenRouter(prompt, model);
    // Clean the response (remove markdown, etc.)
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError: any) {
      return {
        phrases: [],
        error: createBatchError('PARSE', `Failed to parse JSON response: ${parseError.message}`, { responseSnippet: cleanedText.substring(0, 1000) })
      };
    }
    if (typeof parsedResponse !== 'object' || parsedResponse === null || !Array.isArray(parsedResponse.phrases)) {
      return {
        phrases: [],
        error: createBatchError('VALIDATION', `API response is not in the expected object format { cleverTitle: string, phrases: [] }`, { receivedType: typeof parsedResponse, value: parsedResponse })
      };
    }
    const phrasesArray = parsedResponse.phrases;
    const cleverTitle = typeof parsedResponse.cleverTitle === 'string' ? parsedResponse.cleverTitle.trim() : undefined;
    const validPhrases: Phrase[] = [];
    const invalidItems: any[] = [];
    for (const item of phrasesArray) {
      if (validatePhrase(item)) {
        item.english = item.english.trim();
        item.thai = item.thai.trim();
        item.thaiMasculine = item.thaiMasculine.trim();
        item.thaiFeminine = item.thaiFeminine.trim();
        item.pronunciation = item.pronunciation.trim();
        if (item.mnemonic) item.mnemonic = item.mnemonic.trim();
        if (item.examples) {
          item.examples = item.examples.map((ex: ExampleSentence) => ({
            ...ex,
            thai: ex.thai.trim(),
            thaiMasculine: ex.thaiMasculine.trim(),
            thaiFeminine: ex.thaiFeminine.trim(),
            pronunciation: ex.pronunciation.trim(),
            translation: ex.translation.trim(),
          }));
        }
        validPhrases.push(item as Phrase);
      } else {
        invalidItems.push(item);
      }
    }
    if (validPhrases.length > 0 && invalidItems.length > 0) {
      return {
        phrases: validPhrases,
        cleverTitle,
        error: createBatchError('VALIDATION', `Some phrases (${invalidItems.length}) failed validation and were omitted`, { invalidItems: invalidItems.slice(0, 5) })
      };
    }
    if (validPhrases.length === 0 && phrasesArray.length > 0) {
      return {
        phrases: [],
        cleverTitle,
        error: createBatchError('VALIDATION', `All ${phrasesArray.length} phrases failed validation checks`, { invalidItems: invalidItems.slice(0, 5) })
      };
    }
    return {
      phrases: validPhrases,
      cleverTitle
    };
  } catch (unexpectedError: any) {
    return {
      phrases: [],
      error: createBatchError('UNKNOWN', `Unexpected error in OpenRouter batch: ${unexpectedError.message}`, { originalError: unexpectedError })
    };
  }
} 