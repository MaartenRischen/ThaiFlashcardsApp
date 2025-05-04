#!/bin/bash
# Script to revert all image optimization changes and restore original image loading

echo "Reverting image optimization changes..."

# Kill any running Next.js processes
pkill -f "node.*next" || true
echo "Stopped any running Next.js processes"

# Clean Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Move the custom loader files to a backup location
echo "Backing up image optimization files..."
if [ -f lib/supabase-image-loader.js ]; then
  mv lib/supabase-image-loader.js lib/supabase-image-loader.js.bak
  echo "Backed up lib/supabase-image-loader.js"
fi

# Notify about the next config changes
echo "Reverted Next.js config to use unoptimized images"
echo "The getOptimizedImageUrl function will still be available in imageStorage.ts but won't be used"

# Restart development server
echo "Starting development server with standard image loading..."
npm run dev 