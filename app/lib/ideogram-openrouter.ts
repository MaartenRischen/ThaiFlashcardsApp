// Service to generate images via OpenRouter's Ideogram integration

export async function generateImageViaOpenRouter(prompt: string): Promise<string | null> {
  console.log('[ideogram-openrouter] Generating image with prompt:', prompt.substring(0, 100) + '...');
  
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[ideogram-openrouter] OPENROUTER_API_KEY not set');
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_URL || 'https://donkeybridge.app',
        'X-Title': 'DonkeyBridge Thai Learning App',
      },
      body: JSON.stringify({
        prompt: `${prompt}. Style: cartoon, colorful, friendly, no text or writing of any kind.`,
        model: 'ideogram/ideogram-v2',
        n: 1,
        size: '1024x1024',
      }),
    });

    console.log('[ideogram-openrouter] Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[ideogram-openrouter] API error:', error);
      return null;
    }

    const data = await response.json();
    console.log('[ideogram-openrouter] Response data:', JSON.stringify(data).substring(0, 200));
    
    const imageUrl = data?.data?.[0]?.url;
    if (imageUrl) {
      console.log('[ideogram-openrouter] Generated image URL:', imageUrl);
      return imageUrl;
    }
    
    console.error('[ideogram-openrouter] No image URL in response');
    return null;
  } catch (error) {
    console.error('[ideogram-openrouter] Error generating image:', error);
    return null;
  }
}
