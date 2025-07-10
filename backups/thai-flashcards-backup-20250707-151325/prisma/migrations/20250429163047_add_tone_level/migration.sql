/*
  Warnings:

  - You are about to drop the column `ridiculousness` on the `PublishedSet` table. All the data in the column will be lost.
  - You are about to drop the column `topics` on the `PublishedSet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FlashcardSet" ADD COLUMN     "toneLevel" INTEGER;

-- AlterTable
ALTER TABLE "PublishedSet" DROP COLUMN "ridiculousness",
DROP COLUMN "topics";
