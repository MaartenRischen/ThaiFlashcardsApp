import { GoogleGenerativeAI } from '@google/generative-ai';
import { shouldBreakdown, extractKeyWords, formatBreakdownMnemonic, isInvalidMnemonic, type BreakdownMnemonic } from './mnemonic-breakdown';

// Access your API key from environment variables (should only be accessed server-side)
const API_KEY = process.env.GEMINI_API_KEY;

// Add a check to ensure the API key is loaded server-side
if (!API_KEY) {
  // Avoid throwing error during client-side build/rendering, but log warning
  if (typeof window === 'undefined') { // Check if server-side
    throw new Error("Missing environment variable: GEMINI_API_KEY");
  } else {
    console.warn("GEMINI_API_KEY is not available on the client-side. AI generation must happen server-side.");
  }
}

// Initialize the Gemini API - Use optional chaining in case API_KEY is missing client-side
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Check if genAI was initialized before getting models
const geminiPro = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }) : null;
const geminiProVision = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }) : null;

// Function to generate mnemonics for Thai words (original single mnemonic)
async function generateSingleMnemonic(thaiWord: string, englishMeaning: string, pronunciation?: string): Promise<string> {
  if (!geminiPro) {
      console.error("Gemini Pro model not initialized. Check API Key and server-side context.");
      return "Error: Gemini model not available.";
  }
  try {
    const prompt = `Create a memorable mnemonic to help remember the Thai word "${thaiWord}" ${pronunciation ? `(pronounced "${pronunciation}")` : ''} which means "${englishMeaning}" in English.

CRITICAL REQUIREMENTS:
1. The mnemonic MUST contain English words or sounds that are phonetically similar to the Thai pronunciation
2. The mnemonic MUST also reference or relate to the English meaning in some way
3. Keep it under 100 characters
4. Do not include any names or personal references
5. Focus on creating a clear phonetic connection to help remember the Thai pronunciation

Example good mnemonics:
- For "สวัสดี" (sa-wat-dee) meaning "hello": "Think: 'Saw what, dee?' - a friendly hello"
- For "ขอบคุณ" (khop-khun) meaning "thank you": "Think: 'Cope-Kun' - coping with gratitude"
- For "ใช่" (chai) meaning "yes": "Think: 'Chai tea' - say yes to chai"

BAD examples to avoid:
- Mnemonics that don't sound like the Thai word
- Mnemonics that don't reference the meaning
- Mnemonics with random names or irrelevant words

Generate a mnemonic following these rules:`;
    
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  } catch (error: unknown) {
    console.error('Error generating mnemonic with Gemini:', error);
    return `Could not generate mnemonic: ${error}`;
  }
}

// Enhanced function to generate mnemonics with breakdown for long sentences
export async function generateMnemonic(thaiWord: string, englishMeaning: string, pronunciation?: string): Promise<string> {
  // Check if we have pronunciation data
  if (!pronunciation) {
    // For backward compatibility, use the original function
    return generateSingleMnemonic(thaiWord, englishMeaning);
  }
  
  // Check if this phrase should be broken down
  if (shouldBreakdown(thaiWord, englishMeaning, pronunciation)) {
    console.log(`Breaking down long sentence: "${englishMeaning}"`);
    
    // Extract key words
    const { thaiWords, pronunciations, englishWords } = extractKeyWords(thaiWord, pronunciation, englishMeaning);
    
    // Generate mnemonics for each component
    const components: BreakdownMnemonic['components'] = [];
    
    for (let i = 0; i < pronunciations.length; i++) {
      const pron = pronunciations[i];
      const thai = thaiWords[i] || '';
      const english = englishWords[i] || '';
      
      // Generate a focused mnemonic for this component
      const mnemonicPrompt = `Create a SHORT mnemonic for the sound "${pron}"${english ? ` (meaning "${english}")` : ''}.

The mnemonic MUST:
1. Use English words that sound like "${pron}"
2. Be under 50 characters
3. Be memorable and creative
${english ? `4. Relate to the meaning "${english}"` : ''}

Example: For "khop" meaning "thank": "Cop says thanks"

Generate:`;
      
      try {
        const result = await geminiPro!.generateContent(mnemonicPrompt);
        const mnemonic = result.response.text().trim();
        
        components.push({
          thai,
          pronunciation: pron,
          english: english || 'part of phrase',
          mnemonic
        });
      } catch (error) {
        console.error(`Error generating mnemonic for component "${pron}":`, error);
        components.push({
          thai,
          pronunciation: pron,
          english: english || 'part of phrase',
          mnemonic: `"${pron}" sounds like...`
        });
      }
    }
    
    // Format the breakdown mnemonic
    const breakdown: BreakdownMnemonic = {
      type: 'breakdown',
      components,
      fullPhrase: {
        thai: thaiWord,
        pronunciation,
        english: englishMeaning
      }
    };
    
    return formatBreakdownMnemonic(breakdown);
  }
  
  // For shorter phrases, generate a single mnemonic
  const mnemonic = await generateSingleMnemonic(thaiWord, englishMeaning, pronunciation);
  
  // Check if the generated mnemonic is invalid (just repeating pronunciation)
  if (isInvalidMnemonic(mnemonic, pronunciation, englishMeaning)) {
    console.log(`Invalid mnemonic detected, attempting breakdown for: "${englishMeaning}"`);
    
    // Force breakdown even for shorter phrases if mnemonic is bad
    const { pronunciations } = extractKeyWords(thaiWord, pronunciation, englishMeaning);
    if (pronunciations.length > 0) {
      const components: BreakdownMnemonic['components'] = [];
      
      for (const pron of pronunciations.slice(0, 3)) { // Max 3 components
        try {
          const result = await geminiPro!.generateContent(
            `Create a SHORT mnemonic for the sound "${pron}". Use English words that sound similar. Keep under 40 characters. Example: "khop" → "Cop says thanks"`
          );
          components.push({
            thai: '',
            pronunciation: pron,
            english: '',
            mnemonic: result.response.text().trim()
          });
        } catch (error) {
          components.push({
            thai: '',
            pronunciation: pron,
            english: '',
            mnemonic: `"${pron}" sounds like...`
          });
        }
      }
      
      const breakdown: BreakdownMnemonic = {
        type: 'breakdown',
        components,
        fullPhrase: { thai: thaiWord, pronunciation, english: englishMeaning }
      };
      
      return formatBreakdownMnemonic(breakdown);
    }
  }
  
  return mnemonic;
}

// Function to generate example sentences for vocabulary
export async function generateExampleSentence(thaiWord: string, englishMeaning: string): Promise<string> {
  if (!geminiPro) {
      console.error("Gemini Pro model not initialized. Check API Key and server-side context.");
      return "Error: Gemini model not available.";
  }
  try {
    const prompt = `Create a simple descriptive example sentence in Thai using the word "${thaiWord}" which means "${englishMeaning}" in English.
                    The sentence should be a statement, NOT a dialogue or question. Avoid using:
                    - Questions or exclamations
                    - Polite phrases like "please", "thank you", "excuse me"
                    - Question words like "what", "where", "when", "why", "how"
                    - Dialogue phrases like "can you", "do you", "may I"
                    Instead, create a simple descriptive statement about a fact, situation, or observation.
                    Return the result as JSON in this exact format:
                    {
                      "thai": "Thai sentence here",
                      "thaiMasculine": "Thai sentence with male polite particle here",
                      "thaiFeminine": "Thai sentence with female polite particle here",
                      "pronunciation": "Pronunciation guide here",
                      "translation": "English translation here"
                    }`;
    
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract the JSON part from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }
    
    throw new Error("Could not parse JSON from Gemini response");
  } catch (error: unknown) {
    console.error('Error generating example sentence with Gemini:', error);
    return `Could not generate example: ${error}`;
  }
}

export { geminiPro, geminiProVision }; 