import { Phrase, BatchError, BatchGenerationResult } from './types';
import { isValidPhrase } from './phrase-validator';
import { MAX_RETRIES } from './constants';
import { PromptConfig } from './prompt-generator';
import { validateMnemonic } from '../mnemonic-validator';

export async function processBatch(
  index: number,
  config: PromptConfig,
  generateFn: (config: PromptConfig) => Promise<{ phrases: unknown[] }>,
  delay = 0
): Promise<BatchGenerationResult> {
  const batchId = `${config.model}-batch-${index}`;
  
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  let retries = 0;
  let lastError: Error | null = null;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`[Batch ${index}] Starting generation with model: ${config.model}, count: ${config.count}`);
      
      const result = await generateFn(config);
      
      if (!result?.phrases || !Array.isArray(result.phrases)) {
        throw new Error('Invalid response format: missing phrases array');
      }

      const validPhrases: Phrase[] = [];
      const mnemonicIssues: string[] = [];

      for (const phrase of result.phrases) {
        if (isValidPhrase(phrase)) {
          // Validate mnemonic
          const mnemonicValidation = validateMnemonic(
            phrase.pronunciation,
            phrase.mnemonic,
            phrase.english
          );
          
          if (!mnemonicValidation.isValid) {
            console.warn(`[Batch ${index}] Mnemonic validation failed for "${phrase.english}":`, mnemonicValidation.issues);
            mnemonicIssues.push(`${phrase.english}: ${mnemonicValidation.issues.join(', ')}`);
            
            // Try to fix the mnemonic using suggestions
            if (mnemonicValidation.suggestions && mnemonicValidation.suggestions.length > 0) {
              phrase.mnemonic = mnemonicValidation.suggestions[0];
              console.log(`[Batch ${index}] Applied suggested mnemonic: ${phrase.mnemonic}`);
            }
          }
          
          validPhrases.push(phrase);
        }
      }
      
      const invalidCount = result.phrases.length - validPhrases.length;

      console.log(`[Batch ${index}] Generated ${validPhrases.length} valid phrases (${invalidCount} invalid)`);
      
      if (mnemonicIssues.length > 0) {
        console.log(`[Batch ${index}] Fixed ${mnemonicIssues.length} mnemonic issues`);
      }

      const errors: BatchError[] = [];
      
      if (invalidCount > 0) {
        errors.push({
          type: 'INVALID_DATA' as const,
          message: `${invalidCount} invalid phrases filtered out`,
          details: { invalidCount, attemptNumber: retries + 1 },
          timestamp: new Date().toISOString()
        });
      }
      
      if (mnemonicIssues.length > 0) {
        errors.push({
          type: 'VALIDATION_ERROR' as const,
          message: `Fixed ${mnemonicIssues.length} mnemonic mismatches`,
          details: { mnemonicIssues, attemptNumber: retries + 1 },
          timestamp: new Date().toISOString()
        });
      }

      return {
        batchId,
        phrases: validPhrases,
        errors
      };

    } catch (error) {
      lastError = error as Error;
      retries++;
      
      console.error(`[Batch ${index}] Error on attempt ${retries}:`, error);
      
      if (retries < MAX_RETRIES) {
        const backoffDelay = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`[Batch ${index}] Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  // All retries failed
  const errorDetails: BatchError = {
    type: 'API_ERROR' as const,
    message: lastError?.message || 'Unknown error',
    details: { batchId, attemptNumber: retries },
    timestamp: new Date().toISOString()
  };

  return {
    batchId,
    phrases: [],
    errors: [errorDetails]
  };
}

export function aggregateBatchResults(
  results: BatchGenerationResult[]
): { phrases: Phrase[], errors: BatchError[] } {
  const allPhrases: Phrase[] = [];
  const allErrors: BatchError[] = [];

  for (const result of results) {
    allPhrases.push(...result.phrases);
    allErrors.push(...result.errors);
  }

  return {
    phrases: allPhrases,
    errors: allErrors
  };
}

export function createBatchDelays(batchCount: number, baseDelay = 500): number[] {
  // Create staggered delays to avoid rate limiting
  return Array.from({ length: batchCount }, (_, i) => i * baseDelay);
} 