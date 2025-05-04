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
      // Create with public access
      const { error } = await adminClient.storage.createBucket(BUCKET_NAME, {
        public: true, // Allow public access to images
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit for images
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/*']
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return false;
      }
      
      // Update RLS policies to allow public access
      try {
        // Create SQL policies directly
        const { error: policyError } = await adminClient.rpc('create_storage_policy', {
          bucket_name: BUCKET_NAME,
          definition: `
            CREATE POLICY "Public Read Access" ON storage.objects
            FOR SELECT USING (bucket_id = '${BUCKET_NAME}');

            CREATE POLICY "Authenticated Write Access" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');

            CREATE POLICY "Authenticated Update Access" ON storage.objects
            FOR UPDATE USING (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');

            CREATE POLICY "Authenticated Delete Access" ON storage.objects
            FOR DELETE USING (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');
          `
        });

        if (policyError) {
          console.error('Error creating storage policies:', policyError);
        } else {
          console.log('Successfully created storage policies');
        }
      } catch (policyError) {
        console.error('Error creating storage policies:', policyError);
      }
      
      console.log(`Successfully created bucket: ${BUCKET_NAME}`);
    }

    // Always ensure the bucket is public
    try {
      const { error: updateError } = await adminClient.storage.updateBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/*'],
        fileSizeLimit: 5 * 1024 * 1024,
      });
      
      if (updateError) {
        console.error('Error updating bucket to be public:', updateError);
      } else {
        console.log('Successfully updated bucket to be public');
      }
    } catch (updateError) {
      console.error('Error updating bucket:', updateError);
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in initializeStorage:', error);
    return false;
  }
}

// Upload an image from a URL with retry logic
export async function uploadImageFromUrl(imageUrl: string, setId: string): Promise<string | null> {
  console.log(`[UPLOAD DEBUG] Attempting to upload image from URL for set ${setId}`, { 
    imageUrlLength: imageUrl?.length || 0,
    imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + '...' : 'null' 
  });
  
  if (!imageUrl) {
    console.error('[UPLOAD ERROR] No image URL provided to uploadImageFromUrl');
    return null;
  }
  
  // If the URL is not from an allowed domain, return it directly
  const allowedDomains = ['images.pexels.com', 'ideogram.ai'];
  try {
    const urlObj = new URL(imageUrl);
    const domain = urlObj.hostname;
    
    // For specific domains that we know have expiring URLs, always store in Supabase
    const mustUpload = domain.includes('ideogram.ai');
    
    if (!mustUpload && !allowedDomains.some(d => domain.includes(d))) {
      console.log(`[UPLOAD INFO] URL domain (${domain}) not in allowed domains list, returning directly`);
      return imageUrl;
    }
    
    console.log(`[UPLOAD DEBUG] URL domain (${domain}) is in allowed domains list, proceeding with upload`);
  } catch (e) {
    console.error('[UPLOAD ERROR] Invalid URL format:', e);
    return null;
  }
  
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      // Download the image
      console.log(`[UPLOAD DEBUG] Fetching image from URL (attempt ${retries + 1}/${MAX_RETRIES + 1})`);
      const response = await fetch(imageUrl, {
        headers: {
          'Accept': 'image/*, */*',
        }
      });
      
      if (!response.ok) {
        console.error(`[UPLOAD ERROR] Failed to fetch image: ${response.status} ${response.statusText}`);
        retries++;
        if (retries <= MAX_RETRIES) {
          console.log(`[UPLOAD DEBUG] Retrying image fetch (${retries}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
          continue;
        }
        return imageUrl; // Return original URL as fallback
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`[UPLOAD DEBUG] Image fetched successfully with content-type: ${contentType}`);
      
      // Ensure it's actually an image
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(`[UPLOAD ERROR] Invalid content type: ${contentType}`);
        return imageUrl; // Return original URL as fallback
      }

      const imageBlob = await response.blob();
      console.log(`[UPLOAD DEBUG] Image blob size: ${imageBlob.size} bytes`);
      
      if (imageBlob.size === 0) {
        console.error('[UPLOAD ERROR] Image blob is empty');
        retries++;
        if (retries <= MAX_RETRIES) continue;
        return imageUrl; // Return original URL as fallback
      }

      // Generate a unique folder structure and filename
      const timestamp = Date.now();
      const filename = `${setId.split('/').pop()}_${timestamp}.webp`;
      const filePath = `${setId}/${filename}`;
      
      console.log(`[UPLOAD DEBUG] Uploading image to Supabase path: ${filePath}`);

      // Try upload with admin client first (bypasses RLS)
      try {
        if (supabaseAdmin) {
          console.log('[UPLOAD DEBUG] Attempting upload with admin client to bypass RLS');
          const { data: adminData, error: adminUploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(filePath, imageBlob, {
              contentType: 'image/webp',
              upsert: true
            });
            
          if (!adminUploadError) {
            console.log('[UPLOAD DEBUG] Image successfully uploaded via admin client:', adminData?.path);
            // Get the public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
              .from(BUCKET_NAME)
              .getPublicUrl(filePath);
              
            console.log('[UPLOAD SUCCESS] Generated public URL via admin client:', publicUrl);
            return publicUrl;
          } else {
            console.error('[UPLOAD ERROR] Error uploading with admin client, falling back to regular client:', adminUploadError);
          }
        }
      } catch (adminError) {
        console.error('[UPLOAD ERROR] Error using admin client for upload:', adminError);
      }

      // Regular upload (if admin failed or isn't available)
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, imageBlob, {
          contentType: 'image/webp',
          upsert: true
        });
        
      if (uploadError) {
        console.error('[UPLOAD ERROR] Error uploading image to Supabase:', uploadError);
        retries++;
        if (retries <= MAX_RETRIES) {
          console.log(`[UPLOAD DEBUG] Retrying upload (${retries}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }
        
        // If all retries failed, return original URL as fallback
        console.log('[UPLOAD WARNING] All upload attempts failed, returning original URL as fallback');
        return imageUrl;
      }
      
      console.log('[UPLOAD DEBUG] Image successfully uploaded to Supabase:', data?.path);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
        
      console.log('[UPLOAD SUCCESS] Generated public URL:', publicUrl);
      return publicUrl;
      
    } catch (error) {
      console.error('[UPLOAD ERROR] Error in uploadImageFromUrl:', error);
      retries++;
      if (retries <= MAX_RETRIES) {
        console.log(`[UPLOAD DEBUG] Retrying after error (${retries}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        continue;
      }
      // Return original URL as fallback after all retries
      console.log('[UPLOAD WARNING] All attempts failed, returning original URL as fallback');
      return imageUrl;
    }
  }
  
  // Return original URL as fallback
  console.log('[UPLOAD WARNING] Max retries exceeded, returning original URL as fallback');
  return imageUrl;
}

// Delete images for a set
export async function deleteImage(setId: string): Promise<boolean> {
  console.log(`Attempting to delete images for set: ${setId}`);
  
  try {
    // Try with admin client first (bypasses RLS)
    if (supabaseAdmin) {
      try {
        const { data: adminData, error: adminError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .list(setId);
    
        if (!adminError && adminData && adminData.length > 0) {
          console.log(`Found ${adminData.length} files to delete for set: ${setId} (using admin client)`);
          const filesToDelete = adminData.map((file: { name: string }) => `${setId}/${file.name}`);
          
          const { error: adminDeleteError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .remove(filesToDelete);
    
          if (!adminDeleteError) {
            console.log(`Successfully deleted ${filesToDelete.length} images for set: ${setId} (using admin client)`);
            return true;
          } else {
            console.error('Error deleting images with admin client:', adminDeleteError);
          }
        }
      } catch (adminError) {
        console.error('Error using admin client for deletion:', adminError);
      }
    }

    // Regular client as fallback
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