const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureImportedFolder() {
  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nProcessing user: ${user.email || user.id}`);
      
      // Check if imported sets folder exists
      const importedFolder = await prisma.folder.findFirst({
        where: {
          userId: user.id,
          name: 'Imported Sets'
        }
      });
      
      if (!importedFolder) {
        console.log('Creating Imported Sets folder...');
        await prisma.folder.create({
          data: {
            userId: user.id,
            name: 'Imported Sets',
            description: 'Flashcard sets imported from friends or the public gallery',
            isDefault: true,
            orderIndex: 5
          }
        });
        console.log('✓ Created Imported Sets folder');
      } else {
        console.log('✓ Imported Sets folder already exists');
      }
      
      // Check for import/gallery_import sets that are in wrong folders
      const misplacedImports = await prisma.flashcardSet.findMany({
        where: {
          userId: user.id,
          source: {
            in: ['import', 'gallery_import']
          },
          folder: {
            name: {
              not: 'Imported Sets'
            }
          }
        },
        include: {
          folder: true
        }
      });
      
      if (misplacedImports.length > 0) {
        console.log(`Found ${misplacedImports.length} misplaced imported sets`);
        
        const targetFolder = importedFolder || await prisma.folder.findFirst({
          where: {
            userId: user.id,
            name: 'Imported Sets'
          }
        });
        
        if (targetFolder) {
          for (const set of misplacedImports) {
            console.log(`Moving set "${set.name}" from "${set.folder?.name}" to "Imported Sets"`);
            await prisma.flashcardSet.update({
              where: { id: set.id },
              data: { folderId: targetFolder.id }
            });
          }
          console.log('✓ Moved all misplaced imported sets');
        }
      } else {
        console.log('✓ No misplaced imported sets found');
      }
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ensureImportedFolder();
