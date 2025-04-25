import { supabase } from '@/app/lib/supabaseClient';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

const BUCKET_NAME = 'set-images';
const MAX_RETRIES = 2;

// Initialize the storage bucket if it doesn't exist (admin only)
export async function initializeStorage() {
  console.log('Initializing Supabase Storage bucket:', BUCKET_NAME);
  const adminClient = supabaseAdmin;
  if (!adminClient) {
    console.error('Admin client not available for bucket creation');
    return false;
  }

  try {
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === BUCKET_NAME);
    console.log(`Bucket ${BUCKET_NAME} exists:`, bucketExists);

    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      const { error } = await adminClient.storage.createBucket(BUCKET_NAME, {
        public: true, // Allow public access to images
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit for images
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      // Set public bucket policy
      const { error: policyError } = await adminClient.storage.from(BUCKET_NAME).createSignedUrl('test.txt', 60);
      if (policyError && !policyError.message.includes('not found')) {
        console.error('Error setting bucket policy:', policyError);
      }
      
      console.log(`Successfully created bucket: ${BUCKET_NAME}`);
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in initializeStorage:', error);
    return false;
  }
}

// Upload an image from a URL with retry logic
export async function uploadImageFromUrl(imageUrl: string, setId: string): Promise<string | null> {
  console.log(`Attempting to upload image from URL for set ${setId}`, { imageUrlLength: imageUrl?.length || 0 });
  
  if (!imageUrl) {
    console.error('No image URL provided to uploadImageFromUrl');
    return null;
  }
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      // Download the image
      console.log(`Fetching image from URL (attempt ${retries + 1}/${MAX_RETRIES + 1})`);
      const response = await fetch(imageUrl, {
        headers: {
          'Accept': 'image/*, */*',
        }
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        retries++;
        if (retries <= MAX_RETRIES) {
          console.log(`Retrying image fetch (${retries}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        }
        return null;
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`Image fetched successfully with content-type: ${contentType}`);
      
      // Ensure it's actually an image
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(`Invalid content type: ${contentType}`);
        return null;
      }

      const imageBlob = await response.blob();
      console.log(`Image blob size: ${imageBlob.size} bytes`);
      
      if (imageBlob.size === 0) {
        console.error('Image blob is empty');
        retries++;
        if (retries <= MAX_RETRIES) continue;
        return null;
      }

      // Generate a unique folder structure and filename
      const timestamp = Date.now();
      const filename = `${setId}_${timestamp}.webp`;
      const filePath = `${setId}/${filename}`;
      
      console.log(`Uploading image to Supabase path: ${filePath}`);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, imageBlob, {
          contentType: 'image/webp',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading image to Supabase:', uploadError);
        retries++;
        if (retries <= MAX_RETRIES) {
          console.log(`Retrying upload (${retries}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        return null;
      }
      
      console.log('Image successfully uploaded to Supabase:', data?.path);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
      console.log('Generated public URL:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('Error in uploadImageFromUrl:', error);
      retries++;
      if (retries <= MAX_RETRIES) {
        console.log(`Retrying after error (${retries}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      return null;
    }
  }
  
  return null;
}

// Delete images for a set
export async function deleteImage(setId: string): Promise<boolean> {
  console.log(`Attempting to delete images for set: ${setId}`);
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(setId);

    if (error) {
      console.error('Error listing images for deletion:', error);
      return false;
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} files to delete for set: ${setId}`);
      const filesToDelete = data.map((file: { name: string }) => `${setId}/${file.name}`);
      
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        console.error('Error deleting images:', deleteError);
        return false;
      }
      
      console.log(`Successfully deleted ${filesToDelete.length} images for set: ${setId}`);
    } else {
      console.log(`No images found to delete for set: ${setId}`);
    }

    return true;
  } catch (error) {
    console.error('Error in deleteImage:', error);
    return false;
  }
} 