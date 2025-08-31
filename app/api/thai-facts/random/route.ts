import { NextRequest, NextResponse } from 'next/server';
import { getRandomThaiFact, getRandomThaiFactByCategory, ThaiFact } from '@/app/lib/thai-facts';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as ThaiFact['category'] | null;
    const difficulty = searchParams.get('difficulty') as ThaiFact['difficulty'] | null;

    let fact: ThaiFact | null;

    if (category) {
      fact = getRandomThaiFactByCategory(category);
    } else {
      fact = getRandomThaiFact();
    }

    if (!fact) {
      return NextResponse.json({ 
        error: 'No facts found for the specified criteria' 
      }, { status: 404 });
    }

    // Filter by difficulty if specified
    if (difficulty && fact.difficulty !== difficulty) {
      // Try to get another fact that matches both criteria
      const allFacts = await import('@/app/lib/thai-facts');
      const filteredFacts = allFacts.thaiFactsDatabase.filter(f => 
        (!category || f.category === category) && f.difficulty === difficulty
      );
      
      if (filteredFacts.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredFacts.length);
        fact = filteredFacts[randomIndex];
      }
    }

    return NextResponse.json({
      type: 'thai-fact',
      fact: fact.fact,
      category: fact.category,
      difficulty: fact.difficulty,
      id: fact.id,
      source: 'database'
    });

  } catch (error) {
    console.error('[thai-facts/random] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Thai fact' 
    }, { status: 500 });
  }
}
