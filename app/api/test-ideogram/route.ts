import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ideogram-service';

// Explicitly load dotenv in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('dotenv').config();
    console.log('Test Ideogram: Loaded .env file in development mode');
  } catch (e) {
    console.warn('Test Ideogram: Failed to load dotenv:', e);
  }
}

export async function GET() {
  try {
    // Load environment variables in development mode
    try {
      require('dotenv').config();
      console.log('Test Ideogram: Loaded .env file in development mode');
    } catch (e) {
      console.warn('Test Ideogram: Failed to load dotenv:', e);
    }
    
    // Test environment variables
    console.log('Test Ideogram: Starting test...');
    console.log('Test Ideogram: IDEOGRAM_API_KEY present:', Boolean(process.env.IDEOGRAM_API_KEY));
    console.log('Test Ideogram: IDEOGRAM_API_KEY first 10 chars:', process.env.IDEOGRAM_API_KEY ? process.env.IDEOGRAM_API_KEY.substring(0, 10) + '...' : 'undefined');
    
    const testPrompt = "Cute cartoon style illustration of a friendly donkey crossing a bridge. Use vibrant, friendly colors.";
    
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