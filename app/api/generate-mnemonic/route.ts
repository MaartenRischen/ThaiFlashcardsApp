import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

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

    // Check if OpenRouter API key is available
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log('[Generate Mnemonic] API Key available:', !!apiKey);
    
    if (!apiKey) {
      console.error('[Generate Mnemonic] OPENROUTER_API_KEY not found in environment');
      return NextResponse.json({ 
        error: 'OpenRouter API key not configured' 
      }, { status: 500 });
    }

    console.log('[Generate Mnemonic] Calling OpenRouter API...');
    
    // Use OpenRouter API to generate a new mnemonic
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Thai Flashcards - Mnemonic Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [
          {
            role: 'system',
            content: `You are a creative mnemonic generator for Thai language learning. Create memorable, clever, and often humorous mnemonics that help English speakers remember Thai words and phrases.

Guidelines:
- Make mnemonics vivid, silly, or absurd - they stick better
- Use wordplay, rhymes, or sound associations when possible
- Keep them concise but memorable
- Make them appropriate for all audiences
- Focus on the sound/pronunciation connection between English and Thai
- Be creative and fun!

Example format: "Think: '[sound association]' - [memorable scenario or wordplay]"`
          },
          {
            role: 'user',
            content: `Create a new mnemonic for:
English: "${english}"
Thai: "${thai}"
Pronunciation: "${pronunciation}"

Generate a creative, memorable mnemonic that helps remember this Thai word/phrase.`
          }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[Generate Mnemonic] OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText);
      console.error('[Generate Mnemonic] Error response:', errorText);
      return NextResponse.json({ 
        error: 'Failed to generate mnemonic',
        details: errorText
      }, { status: 500 });
    }

    const data = await openRouterResponse.json();
    console.log('[Generate Mnemonic] OpenRouter response:', data);
    
    const mnemonic = data.choices?.[0]?.message?.content?.trim();

    if (!mnemonic) {
      console.log('[Generate Mnemonic] No mnemonic in response');
      return NextResponse.json({ 
        error: 'No mnemonic generated' 
      }, { status: 500 });
    }

    console.log('[Generate Mnemonic] Generated mnemonic:', mnemonic);
    return NextResponse.json({ mnemonic });

  } catch (error) {
    console.error('[Generate Mnemonic] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
