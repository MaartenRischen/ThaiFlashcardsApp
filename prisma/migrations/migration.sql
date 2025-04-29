-- First, copy data from topics to specificTopics where specificTopics is null
UPDATE "PublishedSet"
SET "specificTopics" = "topics"
WHERE "specificTopics" IS NULL AND "topics" IS NOT NULL;

-- Then safely drop the topics column
ALTER TABLE "PublishedSet" DROP COLUMN "topics"; 