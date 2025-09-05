-- AlterTable
ALTER TABLE "SetRating" 
  ADD COLUMN "flashcardSetId" TEXT,
  ALTER COLUMN "publishedSetId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SetRating_userId_flashcardSetId_key" ON "SetRating"("userId", "flashcardSetId");

-- CreateIndex
CREATE INDEX "SetRating_flashcardSetId_idx" ON "SetRating"("flashcardSetId");

-- AddForeignKey
ALTER TABLE "SetRating" ADD CONSTRAINT "SetRating_flashcardSetId_fkey" FOREIGN KEY ("flashcardSetId") REFERENCES "FlashcardSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
