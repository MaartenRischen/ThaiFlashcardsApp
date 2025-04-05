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

export interface GenerationResult {
  phrases: Phrase[];
  errors: any[];
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
 * Generates a batch of flashcards using the Gemini API
 */
async function generateFlashcardsBatch(prompt: string): Promise<Phrase[]> {
  try {
    // Call Gemini API to generate content
    const result = await geminiPro.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response (Gemini might sometimes wrap JSON in markdown)
    const cleanedText = responseText.replace(/^```json\s*|```$/g, '').trim();

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", cleanedText, parseError);
      throw new Error("Invalid JSON response from API");
    }

    if (!Array.isArray(parsedResponse)) {
      console.error("API response is not a JSON array:", parsedResponse);
      throw new Error("API response is not in the expected array format");
    }

    const validPhrases: Phrase[] = [];
    const invalidData: any[] = [];

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
        console.warn("Invalid phrase structure received:", item);
        invalidData.push(item);
      }
    }

    // Log the result summary
    console.log(`Generated batch: ${validPhrases.length} valid, ${invalidData.length} invalid.`);
    return validPhrases;

  } catch (error) {
    console.error("Error generating flashcards batch:", error);
    throw error; // Propagate error for retry logic
  }
}

/**
 * Main function to generate a complete custom flashcard set
 */
export async function generateCustomSet(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  totalCount: number,
  onProgressUpdate?: (progress: { completed: number, total: number }) => void
): Promise<GenerationResult> {
  const allGeneratedPhrases: Phrase[] = [];
  const errors: any[] = [];
  let remainingCount = totalCount;

  while (remainingCount > 0 && allGeneratedPhrases.length < totalCount) {
    const currentBatchSize = Math.min(remainingCount, BATCH_SIZE);
    const existingEnglish = allGeneratedPhrases.map(p => p.english); // Get already generated phrases

    const prompt = buildGenerationPrompt({
      ...preferences,
      count: currentBatchSize,
      existingPhrases: existingEnglish,
    });

    let retries = 0;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      try {
        console.log(`Attempting to generate batch of ${currentBatchSize} cards... (Retry ${retries})`);
        const batchResult = await generateFlashcardsBatch(prompt);

        // Filter out potential duplicates
        const newPhrases = batchResult.filter(p => 
          !existingEnglish.includes(p.english)
        );

        allGeneratedPhrases.push(...newPhrases);
        remainingCount -= newPhrases.length;
        success = true;

        // Call progress update callback if provided
        if (onProgressUpdate) {
          onProgressUpdate({
            completed: allGeneratedPhrases.length,
            total: totalCount
          });
        }

        // If the API returned fewer valid cards than requested, log it
        if (batchResult.length < currentBatchSize) {
          console.warn(`Batch generation returned ${batchResult.length}/${currentBatchSize} valid cards.`);
        }
      } catch (error) {
        retries++;
        console.error(`Error generating batch (Attempt ${retries}/${MAX_RETRIES}):`, error);
        
        if (retries >= MAX_RETRIES) {
          console.error(`Max retries reached for batch. Skipping.`);
          errors.push({
            message: `Failed to generate a batch of ${currentBatchSize} cards after ${MAX_RETRIES} attempts.`,
            details: error,
            promptSnippet: prompt.substring(0, 200) + '...' // Log part of the prompt for debugging
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
    }
  }

  console.log(`Total generation complete. Generated ${allGeneratedPhrases.length} phrases. ${errors.length} batch errors.`);

  return {
    phrases: allGeneratedPhrases,
    errors: errors
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
 */
export async function generateSingleFlashcard(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  targetEnglishMeaning?: string
): Promise<Phrase | null> {
  try {
    const prompt = buildGenerationPrompt({
      ...preferences,
      count: 1,
      existingPhrases: targetEnglishMeaning ? undefined : []
    });

    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const result = await generateFlashcardsBatch(prompt);
        if (result.length > 0) {
          return result[0];
        }
        retries++;
      } catch (error) {
        retries++;
        if (retries >= MAX_RETRIES) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating single flashcard:", error);
    return null;
  }
} 