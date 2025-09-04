const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDefaultSetImages() {
  console.log('Updating default set images to use thumbnails...');
  
  try {
    // Get all default sets
    const defaultSets = await prisma.flashcardSet.findMany({
      where: {
        source: 'default'
      }
    });
    
    console.log(`Found ${defaultSets.length} default sets to update`);
    
    for (const set of defaultSets) {
      const baseId = set.id.includes('__') ? set.id.split('__')[0] : set.id;
      let newImageUrl;
      
      if (baseId === 'default') {
        newImageUrl = '/images/thumbnails/defaultnew.png';
      } else if (baseId.startsWith('common-words-') || baseId.startsWith('default-common-words-')) {
        const num = baseId.replace('default-common-words-', '').replace('common-words-', '');
        const padded = String(parseInt(num, 10)).padStart(2, '0');
        newImageUrl = `/images/thumbnails/defaults/default-common-words-${padded}.png`;
      } else if (baseId.startsWith('common-sentences-') || baseId.startsWith('default-common-sentences-')) {
        const num = baseId.replace('default-common-sentences-', '').replace('common-sentences-', '');
        newImageUrl = `/images/thumbnails/defaults/default-common-sentences-${num}.png`;
      } else {
        // Map other sets to thailand images
        const thailandMap = {
          'numbers-1-10': '01',
          'basic-colors': '02',
          'days-of-week': '03',
          'family-members': '04',
          'months-of-year': '05',
          'body-parts': '06',
          'animals': '07',
          'thai-proverbs': '08',
          'clothing': '09',
          'transportation': '10',
          'food-and-drinks': '11',
        };
        const idx = thailandMap[baseId] || thailandMap[baseId.replace('default-', '')];
        if (idx) {
          newImageUrl = `/images/thumbnails/defaults/default-thailand-${idx}.png`;
        } else {
          newImageUrl = '/images/thumbnails/default-set-logo.png';
        }
      }
      
      if (newImageUrl !== set.imageUrl) {
        await prisma.flashcardSet.update({
          where: { id: set.id },
          data: { imageUrl: newImageUrl }
        });
        console.log(`Updated ${set.name} (${set.id}): ${set.imageUrl} -> ${newImageUrl}`);
      }
    }
    
    console.log('Done updating default set images!');
  } catch (error) {
    console.error('Error updating images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDefaultSetImages();
