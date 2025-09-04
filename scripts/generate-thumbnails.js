const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const THUMBNAIL_WIDTH = 400; // Smaller width for thumbnails
const THUMBNAIL_QUALITY = 80; // Good quality but smaller file size

async function generateThumbnails() {
  const imagesDir = path.join(__dirname, '../public/images');
  const defaultsDir = path.join(imagesDir, 'defaults');
  const thumbnailsDir = path.join(imagesDir, 'thumbnails');
  
  // Create thumbnails directory if it doesn't exist
  try {
    await fs.mkdir(thumbnailsDir, { recursive: true });
    await fs.mkdir(path.join(thumbnailsDir, 'defaults'), { recursive: true });
  } catch (error) {
    console.error('Error creating thumbnails directory:', error);
  }
  
  // Process all images in the defaults directory
  const files = await fs.readdir(defaultsDir);
  const imageFiles = files.filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));
  
  console.log(`Found ${imageFiles.length} images to process...`);
  
  for (const file of imageFiles) {
    const inputPath = path.join(defaultsDir, file);
    const outputPath = path.join(thumbnailsDir, 'defaults', file);
    
    try {
      const stats = await fs.stat(inputPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({ quality: THUMBNAIL_QUALITY, compressionLevel: 9 })
        .toFile(outputPath);
      
      const newStats = await fs.stat(outputPath);
      const newSizeMB = (newStats.size / 1024 / 1024).toFixed(2);
      
      console.log(`✓ ${file}: ${sizeMB}MB → ${newSizeMB}MB`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
    }
  }
  
  // Also process other important images
  const otherImages = [
    'defaultnew.png',
    'default-set-logo.png'
  ];
  
  for (const file of otherImages) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(thumbnailsDir, file);
    
    try {
      await sharp(inputPath)
        .resize(THUMBNAIL_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .png({ quality: THUMBNAIL_QUALITY, compressionLevel: 9 })
        .toFile(outputPath);
      
      console.log(`✓ ${file} thumbnail created`);
    } catch (error) {
      // File might not exist, that's okay
    }
  }
  
  console.log('\nThumbnail generation complete!');
}

generateThumbnails().catch(console.error);
