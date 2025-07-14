// Import types from generation module
import type { Phrase, GeneratePromptOptions, ExampleSentence, GenerationResult, CustomSet, BatchError, BatchErrorType } from './generation/types';
import { TEXT_MODELS } from './generation/constants';

// Import from generation module
import {
  getBatchSize,
  IRREGULAR_PLURALS as GEN_IRREGULAR_PLURALS,
  PLURAL_ENDINGS as GEN_PLURAL_ENDINGS,
  SEMANTIC_GROUPS as GEN_SEMANTIC_GROUPS,
  COMPOUND_WORDS as GEN_COMPOUND_WORDS,
  VERB_FORMS as GEN_VERB_FORMS,
  THAI_PARTICLES as GEN_THAI_PARTICLES,
  isValidPhrase,
  normalizeEnglish,
  isDuplicatePhrase,
  dedupeAndCapitalizePhrases,
  hasThaiDuplicatePatterns,
  validateBatch,
  sanitizePhrase,
  generateSystemPrompt,
  generateUserPrompt,
  createPromptConfig,
  type PromptConfig,
  processBatch,
  aggregateBatchResults,
  createBatchDelays
} from './generation';

// Import utils
import { getToneLabel } from './utils';

// Export types for external use
export type { 
  Phrase,
  ExampleSentence,
  GeneratePromptOptions,
  GenerationResult,
  CustomSet,
  BatchError,
  BatchErrorType,
  PromptConfig
};

// Export constants
export { TEXT_MODELS };

// Constants prefixed with underscore to indicate they're unused
export const _INITIAL_PHRASES: Phrase[] = [];

export const _MAX_RETRIES = 3;

export const _IRREGULAR_PLURALS = GEN_IRREGULAR_PLURALS;

export const _PLURAL_ENDINGS = GEN_PLURAL_ENDINGS;

export const _SEMANTIC_GROUPS = GEN_SEMANTIC_GROUPS;

export const _COMPOUND_WORDS = GEN_COMPOUND_WORDS;

export const _VERB_FORMS = GEN_VERB_FORMS;

export const _THAI_PARTICLES = GEN_THAI_PARTICLES;

export const _normalizeEnglish = normalizeEnglish;

export const _isDuplicatePhrase = isDuplicatePhrase;

export const _hasThaiDuplicatePatterns = hasThaiDuplicatePatterns;

export const _validateBatch = validateBatch;

export const _sanitizePhrase = sanitizePhrase;

export const _generateUserPrompt = generateUserPrompt;

// Re-export other functions
export {
  getBatchSize,
  isValidPhrase,
  dedupeAndCapitalizePhrases,
  generateSystemPrompt,
  createPromptConfig,
  processBatch,
  aggregateBatchResults,
  createBatchDelays
};

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
 * Main function to generate a custom set of flashcards
 */
export async function generateCustomSet(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  totalCount: number,
  onProgressUpdate?: (progress: { completed: number, total: number, latestPhrases?: Phrase[] }) => void
): Promise<GenerationResult> {
  console.log(`[generateCustomSet] Starting generation for ${totalCount} phrases`);
  
    const allPhrases: Phrase[] = [];
  const aggregatedErrors: BatchError[] = [];
    let cleverTitle: string | undefined;
  let llmBrand: string | undefined;
  let llmModel: string | undefined;
  let successfulModel: string | undefined;
  let temperatureUsed: number | undefined;
  
  // Select primary model
  const primaryModel = TEXT_MODELS[0];
  const batchSize = getBatchSize(primaryModel);
  const batchCount = Math.ceil(totalCount / batchSize);
  
  console.log(`[generateCustomSet] Using model: ${primaryModel}, batch size: ${batchSize}, batches: ${batchCount}`);
  
  // Create batch configurations
  const batchConfigs: PromptConfig[] = [];
  for (let i = 0; i < batchCount; i++) {
    const phraseCount = i === batchCount - 1 
      ? totalCount - (i * batchSize)
      : batchSize;
      
    const config = createPromptConfig(primaryModel, {
          ...preferences,
      count: phraseCount,
      existingPhrases: allPhrases.map(p => p.english)
    });
    
    batchConfigs.push(config);
  }
  
  // Process batches with fallback to other models
  for (let modelIndex = 0; modelIndex < TEXT_MODELS.length; modelIndex++) {
    const currentModel = TEXT_MODELS[modelIndex];
    console.log(`[generateCustomSet] Attempting with model: ${currentModel}`);
    
    try {
      // Update configs for current model
      const updatedConfigs = batchConfigs.map(config => ({
        ...config,
        model: currentModel
      }));
      
      // Process batches
      const batchPromises = updatedConfigs.map(async (config, index) => {
        const delay = createBatchDelays(batchCount)[index];
        return processBatch(
          index,
          config,
          async (cfg) => {
            const result = await generateOpenRouterBatch(
              cfg.userPrompt,
              [cfg.model],
              index,
              preferences.toneLevel
            );
            
            if (!cleverTitle && result.cleverTitle) {
              cleverTitle = result.cleverTitle;
            }
            
            if (result.temperature) {
              temperatureUsed = result.temperature;
            }
            
            return { phrases: result.phrases };
          },
          delay
        );
      });
      
      const results = await Promise.all(batchPromises);
      
      // Aggregate results
      const aggregated = aggregateBatchResults(results);
      allPhrases.push(...aggregated.phrases);
      aggregatedErrors.push(...aggregated.errors);
      
      // Update progress
      if (onProgressUpdate) {
        onProgressUpdate({ 
          completed: allPhrases.length, 
          total: totalCount,
          latestPhrases: aggregated.phrases
        });
      }
      
      // Check if we have enough phrases
      if (allPhrases.length >= totalCount * 0.8) {
        successfulModel = currentModel;
        break;
      }
      
    } catch (error) {
      console.error(`[generateCustomSet] Model ${currentModel} failed:`, error);
             aggregatedErrors.push(createBatchError(
        'API_ERROR',
        `Model ${currentModel} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { model: currentModel, error }
      ));
    }
  }
  
  // Final processing
  const dedupedPhrases = dedupeAndCapitalizePhrases(allPhrases).slice(0, totalCount);
  
  // Set LLM metadata
  if (successfulModel) {
    const [brand, model] = successfulModel.split('/');
    llmBrand = brand;
    llmModel = model;
  }
  
  console.log(`[generateCustomSet] Generation complete. Generated ${dedupedPhrases.length} unique phrases`);
  
  return {
      phrases: dedupedPhrases,
      cleverTitle,
      aggregatedErrors,
    llmBrand,
    llmModel,
    temperature: temperatureUsed,
    errorSummary: aggregatedErrors.length > 0 ? {
      errorTypes: Array.from(new Set(aggregatedErrors.map(e => e.type))),
      totalErrors: aggregatedErrors.length,
      userMessage: generateUserErrorMessage(aggregatedErrors)
    } : undefined
  };
}

function generateUserErrorMessage(errors: BatchError[]): string {
  const errorCounts = errors.reduce((acc, error) => {
    acc[error.type] = (acc[error.type] || 0) + 1;
    return acc;
  }, {} as Record<BatchErrorType, number>);
  
  const messages: string[] = [];
  
  if (errorCounts.API_ERROR || errorCounts.NETWORK_ERROR) {
    messages.push('Some API calls failed, but we generated what we could.');
  }
  
  if (errorCounts.INVALID_DATA || errorCounts.PARSE_ERROR) {
    messages.push('Some generated content was invalid and was filtered out.');
  }
  
  if (errorCounts.RATE_LIMIT) {
    messages.push('We hit rate limits but managed to generate most of your set.');
  }
  
  return messages.length > 0 
    ? messages.join(' ') + ' Your flashcard set is ready!'
    : 'Generation completed successfully!';
}

export function createCustomSet(
  name: string, 
  level: string, 
  specificTopics: string | undefined, 
  phrases: Phrase[],
  seriousness?: number
): Omit<CustomSet, 'mnemonics' | 'goals'> {
  const set: Omit<CustomSet, 'mnemonics' | 'goals'> = {
    name,
    level,
    specificTopics,
    createdAt: new Date().toISOString(),
    phrases
  };
  
  if (seriousness !== undefined) {
    set.seriousness = seriousness;
  }
  
  return set;
}

export async function generateSingleFlashcard(
  preferences: Omit<GeneratePromptOptions, 'count' | 'existingPhrases'>,
  targetEnglishMeaning?: string
): Promise<{ phrase: Phrase | null, error?: BatchError }> {
  const promptOptions: GeneratePromptOptions = {
      ...preferences,
      count: 1,
    specificTopics: targetEnglishMeaning || preferences.specificTopics
  };
  
  const config = createPromptConfig(TEXT_MODELS[0], promptOptions);
  
  for (const model of TEXT_MODELS) {
    try {
      const updatedConfig = { ...config, model };
      const prompt = updatedConfig.userPrompt;
      
      const result = await generateOpenRouterBatch(
        prompt,
        [model],
        0,
        preferences.toneLevel
      );
      
      if (result.phrases && result.phrases.length > 0) {
          return { phrase: result.phrases[0] };
        }
    } catch (error) {
      console.error(`[generateSingleFlashcard] Model ${model} failed:`, error);
    }
  }
  
    return { 
      phrase: null, 
         error: createBatchError(
       'API_ERROR',
       'All models failed to generate flashcard',
       { targetEnglishMeaning }
     )
  };
}

function getTemperatureFromToneLevel(toneLevel: number | undefined): number {
  if (!toneLevel) return 0.7;
  
  const tempMap: Record<number, number> = {
    1: 0.1, 2: 0.2, 3: 0.3, 4: 0.4, 5: 0.5,
    6: 0.6, 7: 0.7, 8: 0.8, 9: 0.9, 10: 1.0
  };
  
  return tempMap[toneLevel] || 0.7;
}

async function callOpenRouterWithFallback(prompt: string, models: string[], temperature: number): Promise<string> {
  const MAX_TOKENS = 4000;
  const headers = {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Title': 'Thai Flashcards App'
  };
  
  for (const model of models) {
    try {
      console.log(`[OpenRouter] Attempting with model: ${model}, temperature: ${temperature}`);
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: generateSystemPrompt(getToneLabel(Math.round(temperature * 10)))
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature,
          max_tokens: MAX_TOKENS
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
      
    } catch (error) {
      console.error(`[OpenRouter] Model ${model} failed:`, error);
      if (model === models[models.length - 1]) {
        throw error;
      }
    }
  }
  
  throw new Error('All models failed');
}

export async function generateOpenRouterBatch(
  prompt: string,
  models: string[],
  batchIndex: number,
  toneLevel?: number
): Promise<{phrases: Phrase[], cleverTitle?: string, error?: BatchError, temperature?: number}> {
    const temperature = getTemperatureFromToneLevel(toneLevel);
  
  try {
    console.log(`[Batch ${batchIndex}] Calling OpenRouter API...`);
    
    const rawResponse = await callOpenRouterWithFallback(prompt, models, temperature);
    
    // Clean and parse response
    const cleanedResponse = rawResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error(`[Batch ${batchIndex}] JSON parse error:`, parseError);
      throw new Error(`Invalid JSON response: ${parseError}`);
    }
    
    // Validate structure
    if (!parsedData.phrases || !Array.isArray(parsedData.phrases)) {
      throw new Error('Response missing phrases array');
    }
    
    // Validate each phrase
    const validPhrases = parsedData.phrases.filter((p: unknown) => isValidPhrase(p));
    
    console.log(`[Batch ${batchIndex}] Validated ${validPhrases.length}/${parsedData.phrases.length} phrases`);
    
        return {
      phrases: validPhrases,
      cleverTitle: parsedData.cleverTitle,
      temperature
    };
    
  } catch (error) {
    const batchError = createBatchError(
      'API_ERROR',
      error instanceof Error ? error.message : 'Unknown error',
      { batchIndex, models }
    );
    
        return {
            phrases: [],
      error: batchError,
      temperature
    };
  }
}

// ... existing code ...