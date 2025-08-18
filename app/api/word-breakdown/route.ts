import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createBreakdownPrompt, parseWordBreakdown } from '@/app/lib/word-breakdown';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thai, pronunciation, english } = await request.json();
    
    if (!thai || !pronunciation || !english) {
      return NextResponse.json(
        { error: 'Missing required fields: thai, pronunciation, english' },
        { status: 400 }
      );
    }

    // Create the prompt
    const prompt = createBreakdownPrompt(thai, pronunciation, english);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Thai Flashcards Word Breakdown',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are a Thai language expert. Provide accurate word-by-word breakdowns of Thai phrases in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate word breakdown' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse the breakdown
    const breakdown = parseWordBreakdown(content);
    
    if (!breakdown) {
      return NextResponse.json(
        { error: 'Failed to parse word breakdown' },
        { status: 500 }
      );
    }

    return NextResponse.json({ breakdown });
  } catch (error) {
    console.error('Word breakdown error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
