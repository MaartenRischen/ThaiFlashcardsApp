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

// Function to generate example sentences for vocabulary with tone control
export async function generateExampleSentence(
  thaiWord: string, 
  englishMeaning: string,
  seriousnessLevel: number = 80 // Default to 80% ridiculous
): Promise<any> {
  
  const ridiculousness = seriousnessLevel; // Assuming seriousnessLevel is 0-100 where 100 is most ridiculous
  const toneDescription = ridiculousness < 20 ? "serious and contextually appropriate" 
                        : ridiculousness < 50 ? "slightly quirky or unusual, but still plausible" 
                        : ridiculousness < 80 ? "noticeably humorous, surreal, or unexpected. Use absurd scenarios."
                        : "extremely absurd, nonsensical, bizarre, and wildly unexpected (like Monty Python or ITYSL). Prioritize humor over logic.";

  try {
    const prompt = `
      Create ONE example sentence in Thai using the word/phrase "${thaiWord}" (which means "${englishMeaning}" in English).
      
      **CRITICAL INSTRUCTION: TONE**
      The example sentence MUST strictly adhere to the following tone: **${toneDescription} (${ridiculousness}% ridiculous)**.
      - Make the situation described in the example sentence match the tone.
      - For higher ridiculousness (60%+), the situation should be funny, strange, surreal, or nonsensical.
      - The sentence must still be grammatically correct Thai for a learner.
      
      **OUTPUT FORMAT:**
      Return the result ONLY as a valid JSON object in this EXACT format (do not add any other text or markdown):
      {
        "thai": "Thai sentence here",
        "thaiMasculine": "Thai sentence with male polite particle here",
        "thaiFeminine": "Thai sentence with female polite particle here",
        "pronunciation": "Simple phonetic pronunciation guide here",
        "translation": "Accurate English translation of the (potentially absurd) Thai sentence here"
      }
    `;
    
    console.log(`Generating example for "${thaiWord}" with tone: ${toneDescription}`);
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract the JSON part from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsedJson = JSON.parse(jsonMatch[0]);
        console.log("Successfully parsed example sentence JSON:", parsedJson);
        return parsedJson;
      } catch (parseError) {
        console.error("Failed to parse JSON from Gemini response:", parseError, "Raw text:", text);
        throw new Error("Could not parse JSON from Gemini response");
      }
    }
    
    console.error("No JSON object found in Gemini response:", text);
    throw new Error("Could not find JSON object in Gemini response");

  } catch (error: any) {
    console.error('Error generating example sentence with Gemini:', error);
    return {
      error: `Could not generate example: ${error.message || error}`
    };
  }
}

export { geminiPro, geminiProVision };

/**
 * Generates multiple distinct mnemonic options for a given Thai/English pair and tone.
 */
export async function generateMnemonicOptions(
  thaiWord: string, 
  englishMeaning: string, 
  seriousnessLevel: number, // 0-100 (0=Serious, 100=Ridiculous)
  count: number = 3 // Number of options to generate
): Promise<{ options?: string[], error?: string }> {
  const toneDescription = seriousnessLevel < 20 ? "serious and factual" 
                        : seriousnessLevel < 50 ? "slightly quirky or clever" 
                        : seriousnessLevel < 80 ? "noticeably humorous or surreal"
                        : "extremely absurd, nonsensical, and bizarre (like Monty Python or ITYSL)";

  // Prompt for mnemonic options
  const prompt = `
    Generate exactly ${count} distinct mnemonic options to help an English speaker remember the Thai word/phrase "${thaiWord}" (which means "${englishMeaning}").

    The mnemonics MUST strictly match the following tone: **${toneDescription} (${seriousnessLevel}% ridiculous)**.

    **CRITICAL:** If "${thaiWord}" is a **full sentence**, focus the mnemonic suggestions primarily on the **most important keyword, concept, or difficult part** within that sentence. Do NOT try to create a mnemonic for the entire sentence structure literally, unless the tone is highly absurd.

    - For serious tone: Focus on literal connections, sound-alikes, or practical memory hooks for the key part.
    - For quirky/clever tone: Use puns, wordplay, or slightly unusual associations for the key part.
    - For humorous/surreal tone: Create funny or weird short scenarios/images related to the key part.
    - For absurd/bizarre tone: Generate completely nonsensical, surreal, or illogical connections related to the key part. Make them funny through extreme absurdity.

    Return the result ONLY as a JSON array of strings, like this:
    [
      "Mnemonic option 1 (focused on key part if input is sentence)",
      "Mnemonic option 2 (focused on key part if input is sentence)",
      "Mnemonic option 3 (focused on key part if input is sentence)"
    ]

    Ensure the response contains ONLY the JSON array, starting with '[' and ending with ']'. Each mnemonic should be a unique suggestion.
  `;

  try {
    console.log(`Generating ${count} mnemonic options for "${thaiWord}" (Tone: ${toneDescription})...`);
    const result = await geminiPro.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/^```json\s*|```$/g, '').trim();
    if (cleanedText.startsWith('[') && cleanedText.endsWith(']')) {
      try {
        const options = JSON.parse(cleanedText);
        if (Array.isArray(options) && options.every(o => typeof o === 'string')) {
            while (options.length < count) { options.push("AI couldn't generate enough options."); } 
            console.log(` -> Generated ${options.length} options.`);
            return { options: options.slice(0, count) }; 
        } else { throw new Error('Parsed JSON is not an array of strings.'); }
      } catch (parseError: any) {
        console.error('Error parsing mnemonic options JSON:', parseError, 'Raw Text:', cleanedText);
        return { error: `Failed to parse mnemonic options: ${parseError.message}` };
      }
    } else {
      console.error('Invalid format for mnemonic options response:', cleanedText);
      return { error: 'Received invalid format from AI for mnemonic options.' };
    }
  } catch (error: any) {
    console.error('Error generating mnemonic options with Gemini:', error);
    return { error: `Could not generate mnemonic options: ${error.message}` };
  }
} 