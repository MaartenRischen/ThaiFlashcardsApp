#!/bin/bash
# Restart script with selective image optimization for set images only

echo "Restarting with selective image optimization..."

# Kill any running Next.js processes
pkill -f "node.*next" || true
echo "Stopped any running Next.js processes"

# Clean Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Install any missing dependencies
echo "Checking for missing dependencies..."
npm install

# Make sure Supabase project ID is set
echo "Checking Supabase project ID..."
node scripts/extract-supabase-id.js

# Restart development server
echo "Starting development server with selective image optimization..."
echo "NOTE: Only Ideogram-generated set images will be optimized, all other images are untouched."
npm run dev 