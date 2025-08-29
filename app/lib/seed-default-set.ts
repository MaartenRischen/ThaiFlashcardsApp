import { prisma } from './prisma';
import { INITIAL_PHRASES, Phrase } from '@/app/data/phrases';

/**
 * Seeds the default flashcard set for all users who don't have one
 * This should be run manually after deployment or during database migrations
 */
export async function seedDefaultSetForAllUsers() {
  try {
    console.log('Starting to seed default sets for users...');
    
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    let createdCount = 0;
    let alreadyExistsCount = 0;
    
    // For each user, check if they have a default set
    for (const user of users) {
      const existingDefaultSet = await prisma.flashcardSet.findFirst({
        where: {
          userId: user.id,
          source: 'default'
        }
      });
      
      if (!existingDefaultSet) {
        // Create default set for this user
        await prisma.flashcardSet.create({
          data: {
            userId: user.id,
            name: 'Default Set',
            source: 'default',
            imageUrl: '/images/defaultnew.png',
            phrases: {
              create: INITIAL_PHRASES.map(phrase => {
                const { examples, ...rest } = phrase as Phrase;
                return {
                  ...rest,
                  examplesJson: examples ? JSON.stringify(examples) : JSON.stringify([])
                };
              })
            }
          }
        });
        
        createdCount++;
        console.log(`Created default set for user ${user.id}`);
      } else {
        alreadyExistsCount++;
      }
    }
    
    console.log(`Seeding complete. Created ${createdCount} default sets. Skipped ${alreadyExistsCount} users who already had default sets.`);
    
  } catch (error) {
    console.error('Error seeding default sets:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
} 