/*
  Warnings:

  - A unique constraint covering the columns `[shareId]` on the table `FlashcardSet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supabaseAuthUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "FlashcardSet" DROP CONSTRAINT "FlashcardSet_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSetProgress" DROP CONSTRAINT "UserSetProgress_userId_fkey";

-- AlterTable
ALTER TABLE "FlashcardSet" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "seriousnessLevel" INTEGER,
ADD COLUMN     "shareId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "supabaseAuthUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardSet_shareId_key" ON "FlashcardSet"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthUserId_key" ON "User"("supabaseAuthUserId");

-- AddForeignKey
ALTER TABLE "FlashcardSet" ADD CONSTRAINT "FlashcardSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("supabaseAuthUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetProgress" ADD CONSTRAINT "UserSetProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("supabaseAuthUserId") ON DELETE CASCADE ON UPDATE CASCADE;
