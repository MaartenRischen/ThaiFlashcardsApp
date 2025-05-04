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
    // Extract project ID from hostname if possible
    const hostname = urlObject.hostname;
    const extractedProjectId = hostname.split('.')[0];
    
    // Pathname might be like /storage/v1/object/public/bucket-name/path/to/image.png
    // We want the part after /public/
    const pathSegments = urlObject.pathname.split('/public/');
    if (pathSegments.length > 1) {
      return {
        path: pathSegments[1], // e.g., bucket-name/path/to/image.png
        projectId: extractedProjectId
      };
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

  let imagePath = src;
  let isSupabaseUrl = false;
  let effectiveProjectId = projectId; // Default to env var

  // Check if src is a full Supabase URL and extract the path
  if (src && src.startsWith('https://') && src.includes('supabase.co')) {
    isSupabaseUrl = true;
    const extracted = getPathFromSupabaseUrl(src);
    if (extracted) {
      console.log(`Supabase Loader: Extracted path "${extracted.path}" and project ID "${extracted.projectId}" from full URL "${src}"`);
      imagePath = extracted.path;
      effectiveProjectId = extracted.projectId; // Use project ID from URL
    } else {
      console.warn(`Supabase Loader: Could not extract path from Supabase URL, using original src: ${src}`);
      return src; // Return original if we can't parse it
    }
  } else if (src) {
    // If it's not local and not a full URL, assume it's intended as a Supabase bucket path
    if (!effectiveProjectId) {
      console.warn(`Supabase Loader: No project ID available for bucket path, returning original: ${src}`);
      return src;
    }
    console.log(`Supabase Loader: Assuming src is already a Supabase bucket path: ${imagePath}`);
    isSupabaseUrl = true;
  } else {
    // Invalid src (null, undefined, empty string)
    console.warn(`Supabase Loader: Received invalid src: ${src}`);
    return src;
  }

  // Only apply transformations if it was identified as a Supabase URL/path
  if (isSupabaseUrl && effectiveProjectId) {
    const validWidth = Number.isInteger(width) && width > 0 ? width : '';
    const transformUrl = new URL(`https://${effectiveProjectId}.supabase.co/storage/v1/render/image/public/${imagePath}`);

    if (validWidth) {
      transformUrl.searchParams.append('width', validWidth.toString());
    }

    const validQuality = Number.isInteger(quality) && quality >= 20 && quality <= 100 ? quality : 75;
    transformUrl.searchParams.append('quality', validQuality.toString());

    console.log(`Supabase Loader: Constructed transform URL: ${transformUrl.toString()}`);
    return transformUrl.toString();
  }

  // Return original src as fallback
  console.warn(`Supabase Loader: Could not process URL, returning original: ${src}`);
  return src;
} 