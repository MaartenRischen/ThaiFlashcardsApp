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
    console.log('Spellcheck: Calling OpenRouter API with phrases:', phrases);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini', // Use fast model for spellcheck
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

    console.log('Spellcheck: OpenRouter response status:', response.status);
    console.log('Spellcheck: OpenRouter response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Spellcheck: OpenRouter API Error Response:', errorText);
      throw new Error(`OpenRouter API Error (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Spellcheck: Raw OpenRouter response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Spellcheck: Failed to parse OpenRouter response as JSON:', parseError);
      console.error('Spellcheck: Response that failed to parse:', responseText);
      throw new Error(`Invalid JSON response from OpenRouter: ${responseText.substring(0, 200)}...`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Spellcheck: Unexpected OpenRouter response structure:', data);
      throw new Error('Unexpected response structure from OpenRouter');
    }

    const content = data.choices[0].message.content;
    console.log('Spellcheck: AI response content:', content);
    
    // Parse the JSON response
    const cleanedContent = content
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim();
    
    console.log('Spellcheck: Cleaned content for parsing:', cleanedContent);
    
    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Spellcheck: Failed to parse AI response as JSON:', parseError);
      console.error('Spellcheck: Content that failed to parse:', cleanedContent);
      throw new Error(`AI returned invalid JSON: ${cleanedContent.substring(0, 200)}...`);
    }
    
    // Validate the response structure
    if (!result.correctedPhrases || !Array.isArray(result.correctedPhrases)) {
      console.error('Spellcheck: Invalid AI response structure:', result);
      throw new Error('AI response missing correctedPhrases array');
    }
    
    console.log('Spellcheck: Successfully processed response:', result);
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
    try {
      const result = await callOpenRouterForSpellCheck(phrases);
      return NextResponse.json(result);
    } catch (spellCheckError) {
      console.error('Spellcheck failed, using original phrases as fallback:', spellCheckError);
      // Fallback: return original phrases if spellcheck fails
      return NextResponse.json({
        correctedPhrases: phrases,
        corrections: [],
        fallback: true
      });
    }
    
  } catch (error) {
    console.error('Spell check API error:', error);
    return NextResponse.json(
      { error: 'Failed to check spelling' },
      { status: 500 }
    );
  }
} 