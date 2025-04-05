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
  goals: string[];
  specificTopics?: string;
  createdAt: string;
  phrases: Phrase[];
  mnemonics: {[key: number]: string};
}

// Configuration constants
const MAX_RETRIES = 3;
const BATCH_SIZE = 8;

/**
 * Builds a detailed prompt for generating Thai flashcards
 */
function buildGenerationPrompt(options: GeneratePromptOptions): string {
  const { level, goals, specificTopics, count, existingPhrases } = options;

  // Define the output schema clearly for the AI
  const schemaDescription = `
  **Output Format:**
  Generate a JSON object containing two keys: "cleverTitle" and "phrases".
  - "cleverTitle": A short, witty, and clever title (under 50 characters) in English for this flashcard set, reflecting the level, goals, and topics.
  - "phrases": An array containing exactly ${count} unique flashcard objects. Each phrase object MUST conform to the following TypeScript interface:

  \`\`\`typescript
  interface Phrase {
    english: string; // The English translation of the phrase/word. Keep it concise.
    thai: string; // The Thai phrase/word in Thai script. This is the base form.
    thaiMasculine: string; // The Thai phrase including the male polite particle "ครับ" (krap) where appropriate for a complete sentence or polite expression. If the base thai phrase is just a noun or adjective, this might be the same as 'thai'.
    thaiFeminine: string; // The Thai phrase including the female polite particle "ค่ะ" (ka) where appropriate for a complete sentence or polite expression. If the base thai phrase is just a noun or adjective, this might be the same as 'thai'.
    pronunciation: string; // An easy-to-read phonetic pronunciation guide (e.g., 'sa-wat-dee krap'). Use informal romanization, not IPA. Focus on clarity for learners.
    mnemonic?: string; // Optional (but highly encouraged): A short, creative mnemonic suggestion in English to help remember the Thai phrase. Make it relevant and memorable. If you cannot create a good one, omit the field or set it to null.
    examples?: ExampleSentence[]; // Optional (but highly encouraged): An array of 1-2 simple example sentences demonstrating the usage of the main Thai phrase.
  }

  interface ExampleSentence {
    thai: string; // The example sentence in Thai script (base form).
    thaiMasculine: string; // The example sentence in Thai script, ending with "ครับ" (krap) if grammatically appropriate for politeness.
    thaiFeminine: string; // The example sentence in Thai script, ending with "ค่ะ" (ka) if grammatically appropriate for politeness.
    pronunciation: string; // Phonetic pronunciation for the example sentence.
    translation: string; // English translation of the example sentence.
  }
  \`\`\`

  Ensure the entire response is ONLY the JSON object, starting with '{' and ending with '}'. Do not include any introductory text, explanations, or markdown formatting outside the JSON structure itself.
  `;

  // Construct the main prompt content
  let prompt = `
  You are an expert AI assistant specialized in creating Thai language learning flashcards for English speakers. Your task is to generate ${count} flashcards tailored to the user's preferences AND create a clever title for the set.

  **User Preferences:**
  - Proficiency Level: ${level}
  - Learning Goals: ${goals.join(', ')}
  ${specificTopics ? `- Specific Topics: ${specificTopics}` : ''}

  **Instructions:**
  1.  **Generate a Clever Title:** Create a short, witty, clever title (English, under 50 chars) for this flashcard set based on the preferences. Store this in the "cleverTitle" key.
  2.  Generate ${count} unique Thai vocabulary words or short phrases relevant to the user's preferences for the "phrases" array.
  3.  **Politeness:** Correctly generate both masculine ("ครับ") and feminine ("ค่ะ") versions where appropriate (usually for full sentences or polite expressions). If the main 'thai' phrase is just a single word (like a noun), the polite versions might be the same as the base 'thai' version unless context implies politeness. Apply the same logic to example sentences.
  4.  **Pronunciation:** Use a clear, simple phonetic romanization system understandable to English speakers.
  5.  **Mnemonics:** Create helpful and concise mnemonics in English if possible.
  6.  **Examples:** Provide 1-2 relevant and simple example sentences showing context, especially for verbs and adjectives. Examples should also be appropriate for the specified proficiency level.
  7.  **Level Appropriateness:** Ensure vocabulary complexity, sentence structure, and concepts match the '${level}' level. For beginners, focus on common, essential words and simple sentence patterns. For advanced, include more nuanced vocabulary and complex structures.
  8.  **Relevance:** Prioritize content directly related to the user's goals (${goals.join(', ')}) ${specificTopics ? `and specific topics (${specificTopics})` : ''}.
  9.  **Accuracy:** Ensure Thai spelling, translations, and pronunciations are accurate.
  10. **Cultural Nuance:** Generate culturally appropriate content.
  11. **Avoid Duplicates:** Do not generate flashcards for the following English phrases: ${existingPhrases && existingPhrases.length > 0 ? existingPhrases.join(', ') : 'None'}

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
  if (data.mnemonic !== undefined && typeof data.mnemonic !== 'string') return false;
  
  if (data.examples !== undefined) {
    if (!Array.isArray(data.examples)) return false;
    
    // Validate each example sentence
    for (const ex of data.examples) {
      if (!ex || typeof ex !== 'object' ||
          typeof ex.thai !== 'string' || ex.thai.trim() === '' ||
          typeof ex.thaiMasculine !== 'string' || ex.thaiMasculine.trim() === '' ||
          typeof ex.thaiFeminine !== 'string' || ex.thaiFeminine.trim() === '' ||
          typeof ex.pronunciation !== 'string' || ex.pronunciation.trim() === '' ||
          typeof ex.translation !== 'string' || ex.translation.trim() === '') {
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
  // Log the prompt being sent to the API (truncated for brevity)
  console.log(`[Batch ${batchIndex}] Sending prompt to Gemini API (first 200 chars): 
    ${prompt.substring(0, 200)}...`);
  
  try {
    // Call Gemini API inside a try-catch
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

    // Log the received raw text (truncated)
    console.log(`[Batch ${batchIndex}] Raw response text (first 200 chars): 
      ${responseText.substring(0, 200)}...`);

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
        
        validPhrases.push(item as Phrase);
      } else {
        console.warn(`[Batch ${batchIndex}] Invalid phrase structure received:`, JSON.stringify(item));
        invalidItems.push(item);
      }
    }

    // Log the validation results
    console.log(`[Batch ${batchIndex}] Validation summary: ${validPhrases.length} valid phrases, ${invalidItems.length} invalid items`);

    // Handle partial validation errors
    if (validPhrases.length > 0 && invalidItems.length > 0) {
      return {
        phrases: validPhrases,
        cleverTitle,
        error: createBatchError('VALIDATION', 
          `Some phrases (${invalidItems.length}) failed validation and were omitted`,
          { invalidItems })
      };
    }
    
    // Handle all items failing validation
    if (validPhrases.length === 0 && phrasesArray.length > 0) {
      return {
        phrases: [],
        cleverTitle,
        error: createBatchError('VALIDATION', 
          `All phrases failed validation checks`,
          { invalidItems })
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
    console.log(`[Batch ${batchIndex}] User preferences: Level=${preferences.level}, Goals=${preferences.goals.join(',')}, Topics=${preferences.specificTopics || 'none'}`);

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
          console.error(`[Batch ${batchIndex}] Error in batch attempt:`, batchResult.error);
          const errorWithBatch = { ...batchResult.error, batchIndex };
          const retryable = ['NETWORK', 'API', 'UNKNOWN'].includes(batchResult.error.type);

          if (retryable) {
            retries++;
            if (retries >= MAX_RETRIES) {
              console.error(`[Batch ${batchIndex}] Max retries reached.`);
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
                   console.log(`[Batch ${batchIndex}] Partial success with non-retryable error. Adding ${newPhrases.length} phrases.`);
                   allGeneratedPhrases.push(...newPhrases);
                   remainingCount -= newPhrases.length;
                   batchAttemptPhrases = newPhrases; // Store for progress update
               }
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
            console.log(`[Batch ${batchIndex}] Success. Generated ${newPhrases.length} unique phrases.`);
            allGeneratedPhrases.push(...newPhrases);
            remainingCount -= newPhrases.length;
            batchAttemptPhrases = newPhrases; // Store successful phrases
          } else {
            console.warn(`[Batch ${batchIndex}] Success, but 0 phrases returned.`);
          }
        }
      } catch (error: any) {
        retries++;
        console.error(`[Batch ${batchIndex}] Uncaught error in generateCustomSet loop (Attempt ${retries}/${MAX_RETRIES}):`, error);
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
    
    // --- Logging and Progress Update Call --- 
    if (success) {
        console.log(`[Batch ${batchIndex}] Overall SUCCEEDED.`);
        if (onProgressUpdate) {
            if (batchAttemptPhrases.length > 0) {
                console.log(` --> Calling onProgressUpdate with ${batchAttemptPhrases.length} latest phrases.`);
                onProgressUpdate({
                    completed: allGeneratedPhrases.length,
                    total: totalCount,
                    latestPhrases: batchAttemptPhrases
                });
            } else {
                console.log(` --> Batch succeeded but 0 new phrases. Calling onProgressUpdate just for count.`);
                onProgressUpdate({
                    completed: allGeneratedPhrases.length,
                    total: totalCount,
                    latestPhrases: [] // Send empty array
                });
            }
        } else {
            console.log(` --> onProgressUpdate callback not provided.`);
        }
    } else {
        console.log(`[Batch ${batchIndex}] Overall FAILED (Max retries or non-retryable error with 0 phrases).`);
        // Optionally, still call onProgressUpdate to update the count even on failure
        if (onProgressUpdate) {
             console.log(` --> Calling onProgressUpdate to update completed count despite batch failure.`);
             onProgressUpdate({
                completed: allGeneratedPhrases.length,
                total: totalCount,
                latestPhrases: [] // No new phrases on failure
             });
        }
    }
    // --- End Logging and Progress Update Call ---
    
    if (!success) {
      remainingCount -= currentBatchSize; // Assume the whole batch size failed
      console.log(`[Batch ${batchIndex}] Adjusting remaining count to ${remainingCount}`);
    }
    
    batchIndex++;
    console.log(`[Batch ${batchIndex-1}] Finished processing batch.`);
  }

  // Create an error summary for client consumption
  const errorTypes = aggregatedErrors.map(err => err.type)
    .filter((value, index, self) => self.indexOf(value) === index); // Unique error types
  const totalErrors = aggregatedErrors.length;
  
  let userMessage = '';
  if (allGeneratedPhrases.length === 0) {
    userMessage = `No cards could be generated. This might be due to ${errorTypes.join(', ').toLowerCase()} issues.`;
  } else if (allGeneratedPhrases.length < totalCount) {
    userMessage = `Some cards couldn't be generated (${allGeneratedPhrases.length}/${totalCount} created). There were issues with ${errorTypes.join(', ').toLowerCase()}.`;
  }

  const errorSummary = {
    errorTypes,
    totalErrors,
    userMessage
  };

  console.log(`Total generation complete. Generated ${allGeneratedPhrases.length}/${totalCount} phrases. Title: "${extractedCleverTitle || 'N/A'}". ${aggregatedErrors.length} batch errors.`);
  
  if (aggregatedErrors.length > 0) {
    console.log('Error summary:', JSON.stringify(errorSummary));
    console.log('Detailed errors:', JSON.stringify(aggregatedErrors));
  }

  return {
    phrases: allGeneratedPhrases,
    cleverTitle: extractedCleverTitle,
    aggregatedErrors,
    errorSummary
  };
}

/**
 * Creates a complete CustomSet object from generated phrases
 */
export function createCustomSet(
  name: string, 
  level: string, 
  goals: string[], 
  specificTopics: string | undefined, 
  phrases: Phrase[]
): CustomSet {
  // Create mnemonics lookup object from phrases that have mnemonics
  const mnemonics: {[key: number]: string} = {};
  phrases.forEach((phrase, index) => {
    if (phrase.mnemonic) {
      mnemonics[index] = phrase.mnemonic;
    }
  });

  return {
    name,
    level,
    goals,
    specificTopics,
    createdAt: new Date().toISOString(),
    phrases,
    mnemonics
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
      console.log(`Target English meaning: ${targetEnglishMeaning}`);
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
        const result = await generateFlashcardsBatch(prompt, -1); // Using -1 to indicate this is not a regular batch
        
        if (result.error) {
          console.error(`Error generating single flashcard (attempt ${retries + 1}):`, result.error);
          retries++;
          
          if (retries >= MAX_RETRIES) {
            return { phrase: null, error: result.error };
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          continue;
        }
        
        if (result.phrases.length > 0) {
          return { phrase: result.phrases[0] };
        }
        
        retries++;
        console.warn(`No phrases returned for single card generation (attempt ${retries})`);
      } catch (error: any) {
        retries++;
        console.error(`Uncaught error in single card generation (attempt ${retries}):`, error);
        
        if (retries >= MAX_RETRIES) {
          return { 
            phrase: null, 
            error: createBatchError('UNKNOWN', `Error generating single flashcard: ${error.message}`, { error })
          };
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', 'Failed to generate single flashcard after multiple attempts', {})
    };
  } catch (error: any) {
    console.error("Unexpected error in generateSingleFlashcard:", error);
    return { 
      phrase: null, 
      error: createBatchError('UNKNOWN', `Unexpected error in generateSingleFlashcard: ${error.message}`, { error })
    };
  }
} 