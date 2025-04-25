import { supabase } from './supabaseClient';
import { supabaseAdmin } from './supabaseAdmin';

const BUCKET_NAME = 'set-images';

// Initialize the storage bucket if it doesn't exist (admin only)
export async function initializeStorage() {
  const adminClient = supabaseAdmin;
  if (!adminClient) {
    console.error('Admin client not available for bucket creation');
    return false;
  }

  const { data: buckets } = await adminClient.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error } = await adminClient.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 1024 * 1024, // 1MB limit for images
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
  }

  return true;
}

// Upload an image from a URL
export async function uploadImageFromUrl(imageUrl: string, setId: string): Promise<string | null> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const imageBlob = await response.blob();

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `${setId}_${timestamp}.webp`;
    const filePath = `${setId}/${filename}`;

    // Upload to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, imageBlob, {
        contentType: 'image/webp',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageFromUrl:', error);
    return null;
  }
}

// Delete an image
export async function deleteImage(setId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(setId);

    if (error) {
      console.error('Error listing images for deletion:', error);
      return false;
    }

    if (data && data.length > 0) {
      const filesToDelete = data.map(file => `${setId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting images:', deleteError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
} 