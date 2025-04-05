import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel } from '@google/generative-ai';

// Access your API key from environment variables (stored in .env.local)
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(API_KEY!);

// For text-only input, use the gemini-1.5-pro model
const geminiPro = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// For multimodal, use the gemini-1.5-pro-vision model
const geminiProVision = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

// Configure safety settings if needed
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Function to generate mnemonics for Thai words
export async function generateMnemonic(thaiWord: string, englishMeaning: string): Promise<string> {
  try {
    const prompt = `Create a memorable mnemonic to help remember the Thai word "${thaiWord}" which means "${englishMeaning}" in English. 
                    The mnemonic should connect the Thai pronunciation with its English meaning 
                    in a memorable way. Keep it under 100 characters.`;
    
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error('Error generating mnemonic with Gemini:', error);
    return `Could not generate mnemonic: ${error}`;
  }
}

// Function to generate example sentences for vocabulary
export async function generateExampleSentence(thaiWord: string, englishMeaning: string): Promise<any> {
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
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error("Could not parse JSON from Gemini response");
  } catch (error) {
    console.error('Error generating example sentence with Gemini:', error);
    return {
      error: `Could not generate example: ${error}`
    };
  }
}

export { geminiPro, geminiProVision }; 