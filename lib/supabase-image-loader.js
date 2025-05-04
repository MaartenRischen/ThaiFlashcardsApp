// Custom Next.js image loader for Supabase transformations
const getSupabaseProjectId = () => {
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

export default function supabaseLoader({ src, width, quality }) {
  // ONLY optimize URLs that match storage/v1/object/public/set-images pattern
  // This is for Supabase-stored set images only
  if (src.includes('supabase.co/storage/v1/object/public/set-images')) {
    const projectId = getSupabaseProjectId();
    // Convert to the transformation URL format
    const transformedSrc = src.replace(
      /supabase\.co\/storage\/v1\/object\/public\//,
      `supabase.co/storage/v1/render/image/public/`
    );
    return `${transformedSrc}?width=${width}&quality=${quality || 75}`;
  }
  
  // For ALL other images, return the original src unchanged
  return src;
} 