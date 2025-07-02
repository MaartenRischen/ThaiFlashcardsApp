// Custom Next.js image loader for Supabase transformations
interface LoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const _getSupabaseProjectId = (): string => {
  // Try to get project ID from environment variable
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID) {
    return process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  }
  
  // Fallback: extract project ID from the Supabase URL if available
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const match = process.env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If we can't determine the project ID, log an error
  console.error('Could not determine Supabase project ID. Please set NEXT_PUBLIC_SUPABASE_PROJECT_ID in your environment variables.');
  return '';
};

export default function supabaseLoader({ src, width, quality }: LoaderParams): string {
  // Apply transformations to ALL Supabase-stored images
  // Check if this is a Supabase storage URL
  if (src.includes('supabase.co/storage/v1/object/public/')) {
    // Convert to the transformation URL format as per Supabase docs
    const transformedSrc = src.replace(
      /supabase\.co\/storage\/v1\/object\/public\//,
      `supabase.co/storage/v1/render/image/public/`
    );
    return `${transformedSrc}?width=${width}&quality=${quality || 75}`;
  }
  
  // For non-Supabase images, return the original src unchanged
  return src;
} 