const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateSetImages() {
  console.log('Updating default set images...');
  
  try {
    // Define the image mapping
    const imageMapping = {
      'numbers-1-10': '/images/thumbnails/defaults/default-thailand-01.png',
      'basic-colors': '/images/thumbnails/defaults/default-thailand-02.png',
      'days-of-week': '/images/thumbnails/defaults/default-thailand-03.png',
      'family-members': '/images/thumbnails/defaults/default-thailand-04.png',
      'months-of-year': '/images/thumbnails/defaults/default-thailand-05.png',
      'body-parts': '/images/thumbnails/defaults/default-thailand-06.png'
    };
    
    // Update each set type across all users
    for (const [setIdPart, imageUrl] of Object.entries(imageMapping)) {
      const result = await prisma.flashcardSet.updateMany({
        where: {
          OR: [
            { id: { contains: setIdPart } },
            { id: `default-${setIdPart}` }
          ],
          source: 'default'
        },
        data: {
          imageUrl: imageUrl
        }
      });
      
      console.log(`Updated ${result.count} sets with ID containing '${setIdPart}' to use image: ${imageUrl}`);
    }
    
    console.log('Successfully updated all default set images!');
  } catch (error) {
    console.error('Error updating set images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSetImages();
