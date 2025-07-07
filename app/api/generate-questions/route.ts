import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      Based on the user's topic for a Thai language flashcard set, generate 2-3 short, open-ended questions to gather more context.
      The questions should help personalize the flashcards.
      The user's topic is: "${topic}"
      
      Return the questions as a JSON object with a "questions" key, which is an array of strings.
      For example: {"questions": ["Who are you meeting?", "What is your relationship with them?"]}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    
    // Clean the response to ensure it's valid JSON
    const jsonString = text.replace(/```json|```/g, '').trim();
    const generated = JSON.parse(jsonString);


    return NextResponse.json(generated);
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 500 });
  }
} 