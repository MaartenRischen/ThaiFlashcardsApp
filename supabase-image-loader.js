// supabase-image-loader.js
const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID; // Read from env var

// Log error during module load if projectId is missing, but don't return here
if (!projectId) {
  console.error("CRITICAL ERROR: NEXT_PUBLIC_SUPABASE_PROJECT_ID environment variable is not set. Image loader will not function correctly.");
}

// Helper function to extract the path from a full Supabase URL
const getPathFromSupabaseUrl = (url) => {
  try {
    const urlObject = new URL(url);
    // Pathname might be like /storage/v1/object/public/bucket-name/path/to/image.png
    // We want the part after /public/
    const pathSegments = urlObject.pathname.split('/public/');
    if (pathSegments.length > 1) {
      return pathSegments[1]; // e.g., bucket-name/path/to/image.png
    }
  } catch (e) {
    // Not a valid URL, or doesn't match expected format
    return null;
  }
  return null;
};

export default function supabaseLoader({ src, width, quality }) {
  // --- NEW: Check for local images first --- 
  if (src && src.startsWith('/')) {
    console.log(`Supabase Loader: Passing through local image src: ${src}`);
    // Return the original path for local images - Next.js default loader will handle these.
    return src;
  }

  // --- Proceed only if it's not a local path AND projectId is set ---
  if (!projectId) {
    console.warn(`Supabase Image Loader: Project ID missing for non-local src, returning original: ${src}`);
    return src; // Return original src if ID is missing for non-local images
  }

  let imagePath = src;
  let isSupabaseUrl = false;

  // Check if src is a full Supabase URL and extract the path
  if (src && src.startsWith('https://') && src.includes('supabase.co')) {
    isSupabaseUrl = true;
    const extractedPath = getPathFromSupabaseUrl(src);
    if (extractedPath) {
      console.log(`Supabase Loader: Extracted path "${extractedPath}" from full URL "${src}"`);
      imagePath = extractedPath;
    } else {
      console.warn(`Supabase Loader: Could not extract path from Supabase URL, using original src (may fail): ${src}`);
      // Fallback to original src if path extraction fails, likely won't work but prevents crash
      imagePath = src; 
    }
  } else if (src) {
    // If it's not local and not a full URL, assume it's intended as a Supabase bucket path.
    // No change needed to imagePath, but log the assumption.
    console.log(`Supabase Loader: Assuming src is already a Supabase bucket path: ${imagePath}`);
    isSupabaseUrl = true; // Treat it as a Supabase path to apply transforms
  } else {
    // Invalid src (null, undefined, empty string)
     console.warn(`Supabase Loader: Received invalid src: ${src}`);
     return src; // Return invalid src as is
  }

  // Only apply transformations if it was identified as a Supabase URL/path
  if (isSupabaseUrl) {
    const validWidth = Number.isInteger(width) && width > 0 ? width : '';
    const transformUrl = new URL(`https://${projectId}.supabase.co/storage/v1/render/image/public/${imagePath}`);

    if (validWidth) {
      transformUrl.searchParams.append('width', validWidth.toString());
    }

    const validQuality = Number.isInteger(quality) && quality >= 20 && quality <= 100 ? quality : 75;
    transformUrl.searchParams.append('quality', validQuality.toString());

    console.log(`Supabase Loader: Constructed transform URL: ${transformUrl.toString()}`);
    return transformUrl.toString();
  } else {
    // Should theoretically not be reached due to the initial local path check, but as a safeguard:
    console.warn(`Supabase Loader: Src was not local but not processed as Supabase URL, returning original: ${src}`);
    return src;
  }
} 