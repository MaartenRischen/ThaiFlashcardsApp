import { geminiPro } from './gemini'; // Import the Gemini instance

// Define types for the generator
export interface Phrase {
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
  goals: string[];
  specificTopics?: string;
  count: number;
  existingPhrases?: string[];
  friendNames?: string[];
  userName?: string;
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

/**
 * Builds a significantly updated prompt for generating Thai flashcards based on detailed user preferences.
 */
function buildGenerationPrompt(options: GeneratePromptOptions): string {
  const { 
    level, 
    specificTopics, 
    count, 
    existingPhrases,
    friendNames = [], 
    userName = 'I', 
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
  - "cleverTitle": A short, witty title (under 50 chars) in English for this flashcard set, reflecting the level, topics, and SERIOUSNESS/RIDICULOUSNESS TONE (${Math.round(ridiculousness * 100)}% ridiculous).
  - "phrases": An array containing exactly ${count} unique flashcard objects. Each phrase object MUST conform to the following TypeScript interface:

  \`\`\`typescript
  interface Phrase {
    english: string; // Concise English translation.
    thai: string; // Thai script (base form).
    thaiMasculine: string; // Polite male version ("ครับ").
    thaiFeminine: string; // Polite female version ("ค่ะ").
    pronunciation: string; // Simple phonetic guide (e.g., 'sa-wat-dee krap').
    mnemonic?: string; // Optional, creative mnemonic reflecting the TONE.
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
  You are an expert AI assistant specialized in creating Thai language learning flashcards for English speakers. Your task is to generate ${count} flashcards and a clever title, tailored precisely to the user's preferences, including a specific TONE.

  **User Preferences:**
  - Proficiency Level: ${level}
  - Topics to Discuss: ${topicsToDiscuss || 'General conversation'}
  ${specificTopics ? `- Specific Focus Within Topics: ${specificTopics}` : ''}
  - Topics to STRICTLY AVOID: ${topicsToAvoid || 'None specified'}
  - User's Name: ${userName}
  - User's Friends' Names: ${friendNames.length > 0 ? friendNames.join(', ') : 'None specified'}
  - **TONE CONTROL: ${seriousnessLevel}% Ridiculous / ${100 - seriousnessLevel}% Serious**

  **CRITICAL INSTRUCTIONS:**

  1.  **Level-Specific Content:**
      *   **Beginner:** Generate mostly essential single words or very short phrases (2-4 words). If sentences are used (sparingly), they MUST be extremely simple (Subject-Verb-Object). Examples should also be very simple.
      *   **Intermediate:** Generate primarily short to medium-length sentences (5-10 words) typical of everyday conversation. Use common vocabulary and grammar structures suitable for this level. Phrases can still be included. Examples should reflect conversational usage.
      *   **Advanced:** Generate ONLY longer, more complex sentences (10+ words) using nuanced vocabulary, varied grammar, idioms (if appropriate for the TONE), and structures a native speaker would understand. Examples should showcase complex usage. NO simple phrases.

  2.  **TONE Implementation (${seriousnessLevel}% Ridiculous / ${100 - seriousnessLevel}% Serious):** This is the MOST important instruction. The desired tone MUST influence ALL generated content:
      *   **Phrases/Sentences:**
          *   Low Ridiculousness (0-20%): Generate standard, textbook-like, polite vocabulary and sentences. Extremely dry and factual.
          *   Medium Ridiculousness (40-60%): A balanced mix. Standard vocabulary but with slightly quirky or unexpected phrasing. Examples can be mildly amusing or odd.
          *   High Ridiculousness (80-100%): Generate absurd, nonsensical, surreal, or humorously inappropriate words and sentences (while still being grammatically valid Thai for the level). Use hyperbole, unexpected combinations, and extreme scenarios. Aim for maximum absurdity and humor.
      *   **Mnemonics:** MUST match the tone. Serious mnemonics for serious tone, wildly absurd mnemonics for ridiculous tone.
      *   **Example Sentences:** MUST strongly reflect the tone. For high ridiculousness, examples should feature ${userName} and friends (${friendNames.join(', ')}) in bizarre, impossible, or hilarious situations related to the '${topicsToDiscuss || 'general topics'}'
      *   **Clever Title:** MUST reflect the chosen tone. A dry title for serious, a witty/absurd title for ridiculous.

  3.  **Personalization:** Integrate the user's name ('${userName}') and their friends' names (${friendNames.join(', ')}) naturally into the EXAMPLE SENTENCES, especially for medium-to-high ridiculousness levels.

  4.  **Topic Control:**
      *   Focus vocabulary and examples *primarily* on the 'Topics to Discuss': ${topicsToDiscuss || 'General conversation'}.
      *   If 'Specific Focus' is provided (${specificTopics || 'None'}), prioritize that within the main topics.
      *   ABSOLUTELY DO NOT generate content related to 'Topics to STRICTLY AVOID': ${topicsToAvoid || 'None specified'}.

  5.  **Politeness & Pronunciation:** Correctly generate masculine ("ครับ") and feminine ("ค่ะ") versions. Use clear, simple phonetic romanization.

  6.  **Accuracy & Culture:** Ensure Thai spelling, translations, and grammar are accurate for the specified LEVEL and TONE. Maintain cultural appropriateness even in absurd contexts (avoid genuinely offensive content unless specifically requested within the absurd tone).

  7.  **Avoid Duplicates:** Do not generate flashcards for the following English phrases that might already exist: ${existingPhrases && existingPhrases.length > 0 ? existingPhrases.join(', ') : 'None'}

  ${schemaDescription}
  `; // End of template literal

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
 * Generates a batch of flashcards using the Gemini API
 * Enhanced with detailed logging and structured error handling
 * Now expects { cleverTitle: string, phrases: Phrase[] } structure
 */
async function generateFlashcardsBatch(
  prompt: string, 
  batchIndex: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError}> {
  // Use standard template literals for logging
  console.log(`[Batch ${batchIndex}] Sending prompt to Gemini API (first 300 chars): 
    ${prompt.substring(0, 300)}...`);
  
  try {
    let responseText: string;
    try {
      console.log(`[Batch ${batchIndex}] Making API call to Gemini...`);
      const result = await geminiPro.generateContent(prompt);
      responseText = result.response.text();
      console.log(`[Batch ${batchIndex}] Successfully received response from Gemini API`);
    } catch (apiError: any) {
      console.error(`[Batch ${batchIndex}] Gemini API call failed:`, apiError);
      
      // Detect network errors
      if (apiError.message && 
         (apiError.message.includes('network') || 
          apiError.message.includes('connection') ||
          apiError.message.includes('timeout'))) {
        return {
          phrases: [],
          error: createBatchError('NETWORK', 
            `Network error when calling Gemini API: ${apiError.message}`, 
            { originalError: apiError })
        };
      }
      
      // General API errors
      return {
        phrases: [],
        error: createBatchError('API', 
          `Error calling Gemini API: ${apiError.message}`, 
          { originalError: apiError, statusCode: apiError.statusCode })
      };
    }

    console.log(`[Batch ${batchIndex}] Raw response text (first 300 chars): 
      ${responseText.substring(0, 300)}...`);

    // Clean the response 
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();

    // Try to parse the JSON object response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedText);
      console.log(`[Batch ${batchIndex}] Successfully parsed JSON response object`);
    } catch (parseError: any) {
      console.error(`[Batch ${batchIndex}] Failed to parse JSON response:`, parseError);
      console.error(`[Batch ${batchIndex}] Problematic text: ${cleanedText.substring(0, 500)}...`);
      
      return {
        phrases: [],
        error: createBatchError('PARSE', 
          `Failed to parse JSON response: ${parseError.message}`, 
          { 
            originalError: parseError, 
            responseSnippet: cleanedText.substring(0, 1000),
            apiResponse: responseText.substring(0, 1000)
          })
      };
    }

    // Validate the response structure - Expect an object with phrases array and title
    if (typeof parsedResponse !== 'object' || parsedResponse === null || !Array.isArray(parsedResponse.phrases)) {
      console.error(`[Batch ${batchIndex}] API response is not the expected object structure:`, parsedResponse);
      return {
        phrases: [],
        error: createBatchError('VALIDATION', 
          `API response is not in the expected object format { cleverTitle: string, phrases: [] }`,
          { receivedType: typeof parsedResponse, value: parsedResponse })
      };
    }
    
    const phrasesArray = parsedResponse.phrases;
    const cleverTitle = typeof parsedResponse.cleverTitle === 'string' ? parsedResponse.cleverTitle.trim() : undefined;
    if (cleverTitle) {
        console.log(`[Batch ${batchIndex}] Extracted cleverTitle: "${cleverTitle}"`);
    } else {
        console.warn(`[Batch ${batchIndex}] cleverTitle missing or not a string in response.`);
    }

    // Process and validate each item in the phrases array
    const validPhrases: Phrase[] = [];
    const invalidItems: any[] = [];

    for (const item of phrasesArray) {
      if (validatePhrase(item)) {
        // Clean and normalize data
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
        console.warn(`[Batch ${batchIndex}] Invalid phrase structure received and skipped:`, JSON.stringify(item));
        invalidItems.push(item);
      }
    }

    // Log the validation results
    console.log(`[Batch ${batchIndex}] Validation summary: ${validPhrases.length} valid phrases, ${invalidItems.length} invalid items skipped`);

    // Handle partial validation errors
    if (validPhrases.length > 0 && invalidItems.length > 0) {
      return {
        phrases: validPhrases,
        cleverTitle,
        error: createBatchError('VALIDATION', 
          `Some phrases (${invalidItems.length}) failed validation and were omitted`,
          { invalidItems: invalidItems.slice(0, 5) }) // Log only first few invalid
      };
    }
    
    // Handle all items failing validation
    if (validPhrases.length === 0 && phrasesArray.length > 0) {
      return {
        phrases: [],
        cleverTitle,
        error: createBatchError('VALIDATION', 
          `All ${phrasesArray.length} phrases failed validation checks`,
          { invalidItems: invalidItems.slice(0, 5) })
      };
    }

    // Success case
    return {
      phrases: validPhrases,
      cleverTitle
    };

  } catch (unexpectedError: any) {
    // Catch any other unexpected errors
    console.error(`[Batch ${batchIndex}] Unexpected error in batch generation:`, unexpectedError);
    return {
      phrases: [],
      error: createBatchError('UNKNOWN', 
        `Unexpected error in batch generation: ${unexpectedError.message}`,
        { originalError: unexpectedError })
    };
  }
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

  console.log(`Starting card generation: ${totalCount} total cards requested with preferences:`, JSON.stringify(preferences));

  while (remainingCount > 0 && allGeneratedPhrases.length < totalCount) {
    const currentBatchSize = Math.min(remainingCount, BATCH_SIZE);
    const existingEnglish = allGeneratedPhrases.map(p => p.english);
    const prompt = buildGenerationPrompt({
      ...preferences,
      count: currentBatchSize,
      existingPhrases: existingEnglish,
    });

    console.log(`[Batch ${batchIndex}] Starting generation of batch with ${currentBatchSize} cards`);
    console.log(`[Batch ${batchIndex}] User preferences: Level=${preferences.level}, Topics=${preferences.topicsToDiscuss || 'none'}, Avoid=${preferences.topicsToAvoid || 'none'}, Tone=${preferences.seriousnessLevel}%`);

    let retries = 0;
    let success = false;
    let batchAttemptPhrases: Phrase[] = []; // Phrases from the latest successful attempt within this batch's retries
    
    while (retries < MAX_RETRIES && !success) {
      console.log(`[Batch ${batchIndex}] Attempt ${retries + 1}/${MAX_RETRIES} start`);
      batchAttemptPhrases = []; // Reset for this attempt
      
      try {
        const batchResult = await generateFlashcardsBatch(prompt, batchIndex);
        
        // Capture title on first success
        if (!extractedCleverTitle && batchResult.cleverTitle) {
          extractedCleverTitle = batchResult.cleverTitle;
          console.log(`[Batch ${batchIndex}] Captured cleverTitle: "${extractedCleverTitle}"`);
        }
        
        if (batchResult.error) {
          console.error(`[Batch ${batchIndex}] Error in batch attempt (${batchResult.error.type}):`, batchResult.error.message);
          const errorWithBatch = { ...batchResult.error, batchIndex };
          const retryable = ['NETWORK', 'API', 'UNKNOWN'].includes(batchResult.error.type);

          if (retryable) {
            retries++;
            if (retries >= MAX_RETRIES) {
              console.error(`[Batch ${batchIndex}] Max retries reached for retryable error.`);
              aggregatedErrors.push(errorWithBatch);
              break; // Exit retry loop for this batch
            }
            // Wait and continue retry loop
            const backoffMs = 1000 * Math.pow(2, retries);
            console.log(`[Batch ${batchIndex}] Retrying after ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          } else {
            // Non-retryable error
            aggregatedErrors.push(errorWithBatch);
            // Check if we still got *some* phrases despite the error (e.g., validation error)
            if (batchResult.phrases.length > 0) {
               const newPhrases = batchResult.phrases.filter(p => 
                 !allGeneratedPhrases.some(existing => existing.english === p.english)
               );
               if (newPhrases.length > 0) {
                   console.log(`[Batch ${batchIndex}] Partial success with non-retryable error (${batchResult.error.type}). Adding ${newPhrases.length} valid phrases.`);
                   allGeneratedPhrases.push(...newPhrases);
                   remainingCount -= newPhrases.length;
                   batchAttemptPhrases = newPhrases; // Store for progress update
               } else {
                   console.warn(`[Batch ${batchIndex}] Non-retryable error (${batchResult.error.type}) occurred, and 0 valid new phrases were extracted.`);
               }
            } else {
                console.error(`[Batch ${batchIndex}] Non-retryable error (${batchResult.error.type}) occurred, and 0 phrases were returned.`);
            }
            success = true; // Mark batch as processed (even if failed non-retryably)
            break; // Exit retry loop
          }
        } else {
          // SUCCESSFUL BATCH ATTEMPT (no errors)
          success = true; // Mark as successful
          if (batchResult.phrases.length > 0) {
            const newPhrases = batchResult.phrases.filter(p => 
              !allGeneratedPhrases.some(existing => existing.english === p.english)
            );
            console.log(`[Batch ${batchIndex}] Success. Generated ${newPhrases.length} unique phrases (out of ${batchResult.phrases.length} returned).`);
            allGeneratedPhrases.push(...newPhrases);
            remainingCount -= newPhrases.length;
            batchAttemptPhrases = newPhrases; // Store successful phrases
          } else {
            console.warn(`[Batch ${batchIndex}] Success, but 0 phrases returned by API or all were duplicates/invalid.`);
          }
        }
      } catch (error: any) {
        retries++;
        console.error(`[Batch ${batchIndex}] UNCAUGHT error during batch attempt ${retries}/${MAX_RETRIES}:`, error);
        if (retries >= MAX_RETRIES) {
          console.error(`[Batch ${batchIndex}] Max retries reached for uncaught error.`);
          aggregatedErrors.push({
            type: 'UNKNOWN', message: `Uncaught error: ${error.message}`,
            details: { error: error.toString(), stack: error.stack },
            timestamp: new Date().toISOString(), batchIndex
          });
          break; 
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    } // End retry loop
    
    // --- Progress Update Call --- 
    if (onProgressUpdate) {
        console.log(` --> Calling onProgressUpdate. Completed: ${allGeneratedPhrases.length}/${totalCount}. Latest: ${batchAttemptPhrases.length}. Batch success: ${success}`);
         onProgressUpdate({
             completed: allGeneratedPhrases.length,
             total: totalCount,
             latestPhrases: batchAttemptPhrases
         });
    }
    // --- End Progress Update Call ---
    
    if (!success) {
      remainingCount -= currentBatchSize; // Assume the whole batch size failed
      console.warn(`[Batch ${batchIndex}] Batch FAILED after max retries. Assuming ${currentBatchSize} cards failed.`);
    }
    
    batchIndex++;
    console.log(`[Batch ${batchIndex-1}] Finished processing batch. ${remainingCount} cards remaining.`);
  }

  // Create an error summary for client consumption
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

  console.log(`Total generation complete. Generated ${allGeneratedPhrases.length}/${totalCount} phrases. Title: "${extractedCleverTitle || 'N/A'}". ${aggregatedErrors.length} batch errors.`);
  
  if (errorSummary) {
    console.log('Error summary:', JSON.stringify(errorSummary));
  }

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
        const result = await generateFlashcardsBatch(prompt, -1);
        
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