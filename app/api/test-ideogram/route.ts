import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ideogram-service';
import dotenv from 'dotenv';

// Initialize environment variables in development
if (process.env.NODE_ENV === 'development') {
  dotenv.config();
  console.log('Test Ideogram: Loaded .env file in development mode');
}

export async function GET() {
  try {
    // Test environment variables
    console.log('Test Ideogram: Starting test...');
    console.log('Test Ideogram: IDEOGRAM_API_KEY present:', Boolean(process.env.IDEOGRAM_API_KEY));
    console.log('Test Ideogram: IDEOGRAM_API_KEY first 10 chars:', process.env.IDEOGRAM_API_KEY ? process.env.IDEOGRAM_API_KEY.substring(0, 10) + '...' : 'undefined');
    
    const testPrompt = "Create a cute cartoon style illustration of a friendly donkey teaching Thai cooking in a traditional kitchen. The donkey should be wearing a chef's hat and using a wok near a wooden bridge. Use vibrant, friendly colors and ensure a balanced 1344x768 composition. NO TEXT OR NUMBERS ALLOWED.";
    
    console.log('Test Ideogram: Calling generateImage with prompt:', testPrompt);
    
    const imageUrl = await generateImage(testPrompt);
    
    if (imageUrl) {
      console.log('Test Ideogram: Successfully generated image:', imageUrl);
      return NextResponse.json({ success: true, imageUrl });
    } else {
      console.error('Test Ideogram: Failed to generate image (null returned)');
      return NextResponse.json({ success: false, error: 'Failed to generate image (null returned)' });
    }
  } catch (error) {
    console.error('Test Ideogram: Error during test:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
} 