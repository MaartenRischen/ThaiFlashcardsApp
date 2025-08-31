import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { english, thai, pronunciation } = await req.json();

    if (!english || !thai || !pronunciation) {
      return NextResponse.json({ 
        error: 'Missing required fields: english, thai, pronunciation' 
      }, { status: 400 });
    }

    // Use OpenRouter API to generate a new mnemonic
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
      console.error('OpenRouter API error:', openRouterResponse.status, openRouterResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to generate mnemonic' 
      }, { status: 500 });
    }

    const data = await openRouterResponse.json();
    const mnemonic = data.choices?.[0]?.message?.content?.trim();

    if (!mnemonic) {
      return NextResponse.json({ 
        error: 'No mnemonic generated' 
      }, { status: 500 });
    }

    return NextResponse.json({ mnemonic });

  } catch (error) {
    console.error('Error generating mnemonic:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
