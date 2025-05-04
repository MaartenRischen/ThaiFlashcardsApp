#!/bin/bash
# Restart script with targeted optimization for Supabase set images ONLY

echo "Restarting with targeted set image optimization..."

# Kill any running Next.js processes
pkill -f "node.*next" || true
echo "Stopped any running Next.js processes"

# Clean Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Make sure Supabase project ID is set
echo "Checking Supabase project ID..."
node scripts/extract-supabase-id.js

# Print confirmation message
echo ""
echo "========================================================"
echo "IMPORTANT: Only images from Supabase storage will be optimized."
echo "All wizard images, UI elements, and non-Supabase images"
echo "will be displayed normally without optimization."
echo "========================================================"
echo ""

# Restart development server
echo "Starting development server with targeted optimization..."
npm run dev 