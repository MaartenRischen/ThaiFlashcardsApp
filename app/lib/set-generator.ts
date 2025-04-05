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
  Generate a JSON array containing exactly ${count} unique flashcard objects. Each object MUST conform to the following TypeScript interface:

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

  Ensure the entire response is ONLY the JSON array, starting with '[' and ending with ']'. Do not include any introductory text, explanations, or markdown formatting outside the JSON structure itself.
  `;

  // Construct the main prompt content
  let prompt = `
  You are an expert AI assistant specialized in creating Thai language learning flashcards for English speakers. Your task is to generate ${count} flashcards tailored to the user's preferences.

  **User Preferences:**
  - Proficiency Level: ${level}
  - Learning Goals: ${goals.join(', ')}
  ${specificTopics ? `- Specific Topics: ${specificTopics}` : ''}

  **Instructions:**
  1.  Generate ${count} unique Thai vocabulary words or short phrases relevant to the user's preferences.
  2.  For each entry, provide the data strictly following the JSON schema defined below.
  3.  **Politeness:** Correctly generate both masculine ("ครับ") and feminine ("ค่ะ") versions where appropriate (usually for full sentences or polite expressions). If the main 'thai' phrase is just a single word (like a noun), the polite versions might be the same as the base 'thai' version unless context implies politeness. Apply the same logic to example sentences.
  4.  **Pronunciation:** Use a clear, simple phonetic romanization system understandable to English speakers.
  5.  **Mnemonics:** Create helpful and concise mnemonics in English if possible.
  6.  **Examples:** Provide 1-2 relevant and simple example sentences showing context, especially for verbs and adjectives. Examples should also be appropriate for the specified proficiency level.
  7.  **Level Appropriateness:** Ensure vocabulary complexity, sentence structure, and concepts match the '${level}' level. For beginners, focus on common, essential words and simple sentence patterns. For advanced, include more nuanced vocabulary and complex structures.
  8.  **Relevance:** Prioritize content directly related to the user's goals (${goals.join(', ')}) ${specificTopics ? `and specific topics (${specificTopics})` : ''}.
  9.  **Accuracy:** Ensure Thai spelling, translations, and pronunciations are accurate.
  10. **Cultural Nuance:** Generate culturally appropriate content.
  ${existingPhrases && existingPhrases.length > 0 ? `11. **Avoid Duplicates:** Do not generate flashcards for the following English phrases: ${existingPhrases.join(', ')}` : ''}

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
 */
async function generateFlashcardsBatch(
  prompt: string, 
  batchIndex: number
): Promise<{phrases: Phrase[], error?: BatchError}> {
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

    // Clean the response (Gemini might sometimes wrap JSON in markdown)
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();

    // Try to parse the JSON response in its own try-catch
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedText);
      console.log(`[Batch ${batchIndex}] Successfully parsed JSON response`);
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

    // Validate the response structure
    if (!Array.isArray(parsedResponse)) {
      console.error(`[Batch ${batchIndex}] API response is not a JSON array:`, parsedResponse);
      return {
        phrases: [],
        error: createBatchError('VALIDATION', 
          `API response is not in the expected array format`,
          { receivedType: typeof parsedResponse, value: parsedResponse })
      };
    }

    // Process and validate each item
    const validPhrases: Phrase[] = [];
    const invalidItems: any[] = [];

    for (const item of parsedResponse) {
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

    // If we have valid phrases but also some invalid ones, we'll return the valid ones with a partial error
    if (validPhrases.length > 0 && invalidItems.length > 0) {
      return {
        phrases: validPhrases,
        error: createBatchError('VALIDATION', 
          `Some phrases (${invalidItems.length}) failed validation and were omitted`,
          { invalidItems })
      };
    }
    
    // If all items failed validation
    if (validPhrases.length === 0 && parsedResponse.length > 0) {
      return {
        phrases: [],
        error: createBatchError('VALIDATION', 
          `All phrases failed validation checks`,
          { invalidItems })
      };
    }

    // Success case - all valid or empty array returned
    return {
      phrases: validPhrases,
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
 * Enhanced with improved error handling and detailed error reporting
 */
export async function generateCustomSet(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  totalCount: number,
  onProgressUpdate?: (progress: { completed: number, total: number }) => void
): Promise<GenerationResult> {
  const allGeneratedPhrases: Phrase[] = [];
  const aggregatedErrors: (BatchError & { batchIndex: number })[] = [];
  
  let remainingCount = totalCount;
  let batchIndex = 0;

  console.log(`Starting card generation: ${totalCount} total cards requested with preferences:`, JSON.stringify(preferences));

  while (remainingCount > 0 && allGeneratedPhrases.length < totalCount) {
    const currentBatchSize = Math.min(remainingCount, BATCH_SIZE);
    const existingEnglish = allGeneratedPhrases.map(p => p.english); // Get already generated phrases

    const prompt = buildGenerationPrompt({
      ...preferences,
      count: currentBatchSize,
      existingPhrases: existingEnglish,
    });

    console.log(`[Batch ${batchIndex}] Starting generation of batch with ${currentBatchSize} cards`);
    console.log(`[Batch ${batchIndex}] User preferences: Level=${preferences.level}, Goals=${preferences.goals.join(',')}, Topics=${preferences.specificTopics || 'none'}`);

    let retries = 0;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      console.log(`[Batch ${batchIndex}] Attempt ${retries + 1}/${MAX_RETRIES} start`);
      
      try {
        const batchResult = await generateFlashcardsBatch(prompt, batchIndex);
        
        // Check for batch error
        if (batchResult.error) {
          console.error(`[Batch ${batchIndex}] Error in batch generation:`, batchResult.error);
          
          // Store the error with batch index
          const errorWithBatch = { 
            ...batchResult.error, 
            batchIndex 
          };
          
          // Only retry certain types of errors
          const retryableErrorTypes: BatchErrorType[] = ['NETWORK', 'API', 'UNKNOWN'];
          
          if (retryableErrorTypes.includes(batchResult.error.type)) {
            retries++;
            
            if (retries >= MAX_RETRIES) {
              console.error(`[Batch ${batchIndex}] Max retries reached for batch.`);
              aggregatedErrors.push(errorWithBatch);
              break; // Stop retrying this batch
            }
            
            // Add exponential backoff delay
            const backoffMs = 1000 * Math.pow(2, retries);
            console.log(`[Batch ${batchIndex}] Retrying after ${backoffMs}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue; // Try again
          } else {
            // Non-retryable error, save and continue to next batch
            aggregatedErrors.push(errorWithBatch);
            // If we got some valid phrases despite the error, we'll consider it a partial success
            if (batchResult.phrases.length > 0) {
              success = true;
            } else {
              break; // No phrases and non-retryable error, move to next batch
            }
          }
        } else {
          // No errors, mark as success
          success = true;
        }

        // We got some valid phrases (either with or without error)
        if (batchResult.phrases.length > 0) {
          // Filter out potential duplicates
          const newPhrases = batchResult.phrases.filter(p => 
            !existingEnglish.includes(p.english)
          );

          console.log(`[Batch ${batchIndex}] Generated ${newPhrases.length} unique phrases (${batchResult.phrases.length} total, ${batchResult.phrases.length - newPhrases.length} duplicates filtered)`);
          
          allGeneratedPhrases.push(...newPhrases);
          remainingCount -= newPhrases.length;

          // Call progress update callback if provided
          if (onProgressUpdate) {
            onProgressUpdate({
              completed: allGeneratedPhrases.length,
              total: totalCount
            });
          }

          // If the API returned fewer valid cards than requested, log it
          if (batchResult.phrases.length < currentBatchSize) {
            console.warn(`[Batch ${batchIndex}] Batch generation returned ${batchResult.phrases.length}/${currentBatchSize} valid cards.`);
          }
        } else if (success) {
          // This is the case where we got no phrases but no error either
          console.warn(`[Batch ${batchIndex}] Batch generated 0 phrases but no error was reported.`);
          aggregatedErrors.push({
            type: 'VALIDATION',
            message: 'Batch generated 0 valid phrases',
            details: { prompt: prompt.substring(0, 200) + '...' },
            timestamp: new Date().toISOString(),
            batchIndex
          });
        }
      } catch (error: any) {
        // This should rarely happen now that generateFlashcardsBatch handles its errors internally
        retries++;
        console.error(`[Batch ${batchIndex}] Uncaught error in generateCustomSet (Attempt ${retries}/${MAX_RETRIES}):`, error);
        
        if (retries >= MAX_RETRIES) {
          console.error(`[Batch ${batchIndex}] Max retries reached for uncaught error.`);
          aggregatedErrors.push({
            type: 'UNKNOWN',
            message: `Uncaught error: ${error.message}`,
            details: { error: error.toString(), stack: error.stack },
            timestamp: new Date().toISOString(),
            batchIndex
          });
          break; // Stop retrying this batch
        }
        
        // Add exponential backoff delay
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    // If a batch permanently failed, adjust the remaining count
    if (!success) {
      remainingCount -= currentBatchSize;
      console.log(`[Batch ${batchIndex}] Batch failed, adjusting remaining count to ${remainingCount}`);
    }
    
    // Move to next batch
    batchIndex++;
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

  console.log(`Total generation complete. Generated ${allGeneratedPhrases.length}/${totalCount} phrases. ${aggregatedErrors.length} batch errors.`);
  
  if (aggregatedErrors.length > 0) {
    console.log('Error summary:', JSON.stringify(errorSummary));
    console.log('Detailed errors:', JSON.stringify(aggregatedErrors));
  }

  return {
    phrases: allGeneratedPhrases,
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