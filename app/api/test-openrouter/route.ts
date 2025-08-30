import { NextRequest, NextResponse } from 'next/server';
import { testOpenRouterConnection } from '@/app/lib/set-generator';

export async function GET(_req: NextRequest) {
  try {
    console.log('[Test OpenRouter] Starting connectivity test...');
    console.log('[Test OpenRouter] API Key present:', !!process.env.OPENROUTER_API_KEY);
    console.log('[Test OpenRouter] API Key length:', process.env.OPENROUTER_API_KEY?.length);
    
    const result = await testOpenRouterConnection();
    
    console.log('[Test OpenRouter] Test result:', result);
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
      apiKeyPresent: !!process.env.OPENROUTER_API_KEY
    });
  } catch (error) {
    console.error('[Test OpenRouter] Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
