#!/bin/bash
# Setup script for Supabase image optimization

echo "Setting up Supabase image optimization..."

# Extract Supabase project ID
echo "Extracting Supabase project ID from URL..."
node scripts/extract-supabase-id.js

# Clean Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Install any missing dependencies
echo "Checking for missing dependencies..."
npm install

# Restart development server
echo "Starting development server with image optimization enabled..."
npm run dev 