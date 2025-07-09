import { NextResponse } from 'next/server';
import { generateImage } from '@/app/lib/ideogram-service';
import { uploadImageFromUrl } from '@/app/lib/imageStorage';

const PLACEHOLDER_IMAGE_PATH = 'set-images/placeholders/generating-set';

export async function GET() {
  try {
    const prompt = "A cute cartoon illustration of a focused donkey sitting at a desk, diligently writing on flashcards. The donkey is wearing glasses and has a determined expression. The scene should be warm and inviting, with soft lighting and a cozy study atmosphere. The donkey should be shown in profile view to emphasize its concentration. NO TEXT OR NUMBERS ALLOWED IN THE IMAGE.";

    console.log('Generating placeholder image for sets...');
    const generatedImageUrl = await generateImage(prompt);

    if (!generatedImageUrl) {
      console.error('Failed to generate placeholder image');
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    // Upload to permanent storage
    const uploadedUrl = await uploadImageFromUrl(generatedImageUrl, PLACEHOLDER_IMAGE_PATH);
    
    if (!uploadedUrl) {
      console.error('Failed to upload placeholder image');
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: uploadedUrl });
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 