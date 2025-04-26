import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getProficiencyLevel(cardCount?: number, seriousnessLevel?: number): string {
  // You can refine this logic as needed
  if (cardCount && cardCount < 15) return 'Beginner';
  if (cardCount && cardCount < 30) return 'Intermediate';
  if (cardCount && cardCount < 50) return 'Advanced';
  if (cardCount && cardCount >= 50) return 'Fluent';
  return 'Beginner';
}

function getRidiculousness(seriousnessLevel?: number): string {
  if (seriousnessLevel === undefined || seriousnessLevel === null) return 'Balanced';
  if (seriousnessLevel <= 30) return 'Serious';
  if (seriousnessLevel >= 70) return 'Ridiculous';
  return 'Balanced';
}

function getTopics(specificTopics?: string): string[] {
  if (!specificTopics) return [];
  return specificTopics.split(',').map(t => t.trim()).filter(Boolean);
}

async function backfill() {
  const sets = await prisma.publishedSet.findMany();
  for (const set of sets) {
    const proficiencyLevel = getProficiencyLevel(set.cardCount ?? undefined, set.seriousnessLevel ?? undefined);
    const ridiculousness = getRidiculousness(set.seriousnessLevel ?? undefined);
    const topics = getTopics(set.specificTopics ?? undefined);
    await prisma.publishedSet.update({
      where: { id: set.id },
      data: {
        proficiencyLevel: proficiencyLevel,
        ridiculousness: ridiculousness,
        topics: topics,
      },
    });
    console.log(`Updated set ${set.id}:`, { proficiencyLevel, ridiculousness, topics });
  }
  await prisma.$disconnect();
  console.log('Backfill complete.');
}

backfill().catch(e => {
  console.error(e);
  process.exit(1);
}); 