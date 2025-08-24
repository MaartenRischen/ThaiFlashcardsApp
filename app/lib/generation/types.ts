export interface ExampleSentence {
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  translation: string;
}

export interface Phrase {
  id?: string;
  english: string;
  thai: string;
  thaiMasculine: string;
  thaiFeminine: string;
  pronunciation: string;
  mnemonic?: string;
  literal?: string;
  examples: ExampleSentence[];
}

export interface GeneratePromptOptions {
  level: 'Complete Beginner' | 'Basic Understanding' | 'Intermediate' | 'Advanced' | 'Native/Fluent' | 'God Mode';
  specificTopics?: string;
  count: number;
  existingPhrases?: string[];
  topicsToDiscuss?: string;
  toneLevel?: number; // 1-10 scale, where 1 is most serious and 10 is most absurd
}

export interface GenerationResult {
  phrases: Phrase[];
  cleverTitle?: string;
  aggregatedErrors?: BatchError[];
  errorSummary?: {
    errorTypes: BatchErrorType[];
    totalErrors: number;
    userMessage: string;
  };
  llmBrand?: string;
  llmModel?: string;
  temperature?: number;
}

export interface BatchError {
  type: BatchErrorType;
  message: string;
  details?: unknown;
  timestamp: string;
}

export type BatchErrorType = 
  | 'INVALID_JSON' 
  | 'MISSING_FIELDS' 
  | 'INVALID_DATA' 
  | 'API_ERROR' 
  | 'NETWORK_ERROR' 
  | 'TIMEOUT' 
  | 'RATE_LIMIT' 
  | 'MODEL_UNAVAILABLE' 
  | 'PARSE_ERROR' 
  | 'UNKNOWN';

export interface CustomSet {
  name: string;
  level: string;
  specificTopics?: string;
  createdAt: string;
  phrases: Phrase[];
  mnemonics: {[key: number]: string};
  seriousness?: number;
}

export interface BatchGenerationResult {
  batchId: string;
  phrases: Phrase[];
  errors: BatchError[];
} 