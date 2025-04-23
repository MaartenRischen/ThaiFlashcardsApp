import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Function to generate mnemonics for Thai words
export async function generateMnemonic(thaiWord: string, englishMeaning: string): Promise<string> {
  if (!geminiPro) {
      console.error("Gemini Pro model not initialized. Check API Key and server-side context.");
      return "Error: Gemini model not available.";
  }
  try {
    const prompt = `Create a memorable mnemonic to help remember the Thai word "${thaiWord}" which means "${englishMeaning}" in English. 
                    The mnemonic should connect the Thai pronunciation with its English meaning 
                    in a memorable way. Keep it under 100 characters.`;
    
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  } catch (error: unknown) {
    console.error('Error generating mnemonic with Gemini:', error);
    return `Could not generate mnemonic: ${error}`;
  }
}

// Function to generate example sentences for vocabulary
export async function generateExampleSentence(thaiWord: string, englishMeaning: string): Promise<string> {
  if (!geminiPro) {
      console.error("Gemini Pro model not initialized. Check API Key and server-side context.");
      return "Error: Gemini model not available.";
  }
  try {
    const prompt = `Create a simple example sentence in Thai using the word "${thaiWord}" which means "${englishMeaning}" in English.
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