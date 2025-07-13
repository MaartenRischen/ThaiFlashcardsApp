import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

async function callOpenRouterForSpellCheck(phrases: string[]): Promise<{
  correctedPhrases: string[],
  corrections: Array<{original: string, corrected: string}>
}> {
  const headers = {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'X-Title': 'Thai Flashcards App'
  };

  const prompt = `You are a helpful spell checker and grammar corrector. Your task is to correct spelling and grammar errors in the following English phrases. 

IMPORTANT RULES:
1. Fix spelling mistakes
2. Fix grammar errors
3. Add appropriate punctuation (? for questions, ! for exclamations, . for statements)
4. Preserve the original meaning and intent
5. Keep corrections minimal - only fix actual errors
6. Maintain the casual tone if present

Input phrases:
${phrases.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

Return a JSON object with this EXACT format:
{
  "correctedPhrases": ["corrected phrase 1", "corrected phrase 2", ...],
  "corrections": [
    {"original": "original phrase", "corrected": "corrected phrase"},
    ...
  ]
}

Only include items in "corrections" array if the phrase was actually changed. If no corrections were needed for a phrase, use the original in correctedPhrases but don't add it to corrections.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for consistent corrections
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    const cleanedContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim();
    
    const result = JSON.parse(cleanedContent);
    
    // Validate the response structure
    if (!result.correctedPhrases || !Array.isArray(result.correctedPhrases)) {
      throw new Error('Invalid response format from AI');
    }
    
    return {
      correctedPhrases: result.correctedPhrases,
      corrections: result.corrections || []
    };
    
  } catch (error) {
    console.error('OpenRouter spell check error:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const authResult = await auth();
    if (!authResult || !authResult.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { phrases } = await request.json();
    
    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json(
        { error: "Invalid input: phrases array required" },
        { status: 400 }
      );
    }

    // Call OpenRouter for spell checking
    const result = await callOpenRouterForSpellCheck(phrases);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Spell check API error:', error);
    return NextResponse.json(
      { error: 'Failed to check spelling' },
      { status: 500 }
    );
  }
} 