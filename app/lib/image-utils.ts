/**
 * Get the thumbnail URL for an image
 * Thumbnails are stored in /images/thumbnails/ with the same structure as the original images
 */
export function getThumbnailUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '/images/default-set-logo.png';
  
  // If it's already a thumbnail, return as is
  if (originalUrl.includes('/thumbnails/')) return originalUrl;
  
  // Convert regular image path to thumbnail path
  // e.g., /images/defaults/default-common-words-01.png -> /images/thumbnails/defaults/default-common-words-01.png
  // e.g., /images/defaultnew.png -> /images/thumbnails/defaultnew.png
  const thumbnailUrl = originalUrl.replace('/images/', '/images/thumbnails/');
  
  return thumbnailUrl;
}

/**
 * Preload an image by creating an Image element
 * Returns a promise that resolves when the image is loaded
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`Failed to preload image: ${url}`);
      resolve(); // Resolve anyway to not block other images
    };
    img.src = url;
  });
}

/**
 * Preload multiple images in parallel
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  await Promise.all(uniqueUrls.map(url => preloadImage(url)));
}
