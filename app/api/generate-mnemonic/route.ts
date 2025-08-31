import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateMnemonic } from '@/app/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    console.log('[Generate Mnemonic] API called');
    
    const { userId } = await auth();
    
    if (!userId) {
      console.log('[Generate Mnemonic] Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Generate Mnemonic] User authenticated:', userId);

    const { english, thai, pronunciation } = await req.json();
    console.log('[Generate Mnemonic] Request data:', { english, thai, pronunciation });

    if (!english || !thai || !pronunciation) {
      console.log('[Generate Mnemonic] Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: english, thai, pronunciation' 
      }, { status: 400 });
    }

    // Try OpenRouter first, then fallback to Gemini
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    console.log('[Generate Mnemonic] OpenRouter API Key available:', !!openRouterApiKey);
    
    let mnemonic: string | null = null;

    // Try OpenRouter first if API key is available
    if (openRouterApiKey) {
      try {
        console.log('[Generate Mnemonic] Trying OpenRouter API...');
        
        const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'X-Title': 'Thai Flashcards - Mnemonic Generator',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini', // Use the same model as the main system
            messages: [
              {
                role: 'system',
                content: `You are an expert Thai language instructor specializing in creating practical, effective memory aids. Your goal is to create memorable mnemonics that help English speakers remember Thai words and phrases.

### MNEMONIC CREATION RULES:
1. Focus on sound similarities between Thai pronunciation and English words
2. Are practical and easy to remember
3. Help with memorization through logical connections
4. Are clear and effective learning tools
5. NEVER include gender-specific pronouns (chan/pom/dichan) in the mnemonic itself
6. NEVER include politeness particles (ka/krap/krub) in the mnemonic
7. For phrases with pronouns, focus on OTHER key words in the phrase
8. Must relate to the meaning while sounding like the pronunciation
9. Keep it under 80 characters
10. Use format: "Think: '[sound association]' - [brief connection to meaning]"

Good examples:
- "ขอบคุณ (khob khun)" → "Think: 'Cop coon' - cop saying thanks"
- "อยากไป (yàak pai)" → "Think: 'Yak pie' - yak wants pie (go)"
- "ที่ไหน (thîi nǎi)" → "Think: 'Tea nigh' - tea at night where?"

Bad examples to AVOID:
- "ผมอยากไป" → "Think: 'pom yàak...'" ❌ (contains pronoun)
- "สวัสดีครับ" → "Think: '...krap'" ❌ (contains particle)
- Just repeating the pronunciation ❌ (not creative)
- Long, complex explanations ❌ (not memorable)`
              },
              {
                role: 'user',
                content: `Create a mnemonic for the Thai phrase "${thai}" which is pronounced "${pronunciation}" and means "${english}" in English.

Generate a single, concise mnemonic following the format: "Think: '[sound association]' - [brief connection to meaning]"`
              }
            ],
            temperature: 0.7,
            max_tokens: 100
          })
        });

        if (openRouterResponse.ok) {
          const data = await openRouterResponse.json();
          console.log('[Generate Mnemonic] OpenRouter response:', data);
          mnemonic = data.choices?.[0]?.message?.content?.trim();
          
          if (mnemonic) {
            console.log('[Generate Mnemonic] Generated mnemonic via OpenRouter:', mnemonic);
          }
        } else {
          const errorText = await openRouterResponse.text();
          console.error('[Generate Mnemonic] OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText);
          console.error('[Generate Mnemonic] Error response:', errorText);
        }
      } catch (error) {
        console.error('[Generate Mnemonic] OpenRouter error:', error);
      }
    }

    // Fallback to Gemini if OpenRouter failed or is not available
    if (!mnemonic) {
      console.log('[Generate Mnemonic] Falling back to Gemini API...');
      try {
        // Use the existing generateMnemonic function which has proven prompting
        mnemonic = await generateMnemonic(thai, english, pronunciation);
        console.log('[Generate Mnemonic] Generated mnemonic via Gemini:', mnemonic);
        
        // Clean up the mnemonic if it has the breakdown format - extract just the simple mnemonic
        if (mnemonic && mnemonic.includes('Remember these key parts:')) {
          // If it's a breakdown mnemonic, try to extract a simpler version
          const lines = mnemonic.split('\n');
          const simpleLine = lines.find(line => line.includes('Think:') && !line.includes('•'));
          if (simpleLine) {
            mnemonic = simpleLine.trim();
          }
        }
      } catch (error) {
        console.error('[Generate Mnemonic] Gemini error:', error);
      }
    }

    if (!mnemonic) {
      console.log('[Generate Mnemonic] No mnemonic generated by any service');
      return NextResponse.json({ 
        error: 'Failed to generate mnemonic - both OpenRouter and Gemini unavailable' 
      }, { status: 500 });
    }

    return NextResponse.json({ mnemonic });

  } catch (error) {
    console.error('[Generate Mnemonic] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
