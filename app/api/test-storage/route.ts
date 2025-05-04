import { NextResponse } from 'next/server';
import { uploadImageFromUrl, initializeStorage } from '@/app/lib/imageStorage';

// Explicitly load dotenv in development
if (process.env.NODE_ENV === 'development') {
  try {
    require('dotenv').config();
    console.log('Test Storage: Loaded .env file in development mode');
  } catch (e) {
    console.warn('Test Storage: Failed to load dotenv:', e);
  }
}

export async function GET() {
  console.log('Test Storage: Starting test...');
  
  try {
    // First reinitialize the storage
    console.log('Test Storage: Initializing storage bucket...');
    const storageInit = await initializeStorage();
    if (!storageInit) {
      console.error('Test Storage: Failed to initialize storage bucket');
      return NextResponse.json({ success: false, error: 'Failed to initialize storage bucket' }, { status: 500 });
    }
    
    // Try to upload a test image - using a reliable image source
    const testImageUrl = 'https://images.pexels.com/photos/5792901/pexels-photo-5792901.jpeg?auto=compress&cs=tinysrgb&w=800';
    console.log('Test Storage: Uploading test image from URL:', testImageUrl);
    
    const imageId = 'test-storage-' + Date.now();
    const uploadedUrl = await uploadImageFromUrl(testImageUrl, `test/${imageId}`);
    
    if (uploadedUrl) {
      console.log('Test Storage: Successfully uploaded image:', uploadedUrl);
      return NextResponse.json({ success: true, imageUrl: uploadedUrl });
    } else {
      console.error('Test Storage: Failed to upload image (null returned)');
      return NextResponse.json({ success: false, error: 'Failed to upload image' }, { status: 500 });
    }
  } catch (error) {
    console.error('Test Storage: Error during test:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
} 