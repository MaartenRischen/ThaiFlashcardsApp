-- DropForeignKey
ALTER TABLE "FlashcardSet" DROP CONSTRAINT "FlashcardSet_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserSetProgress" DROP CONSTRAINT "UserSetProgress_userId_fkey";

-- AddForeignKey
ALTER TABLE "FlashcardSet" ADD CONSTRAINT "FlashcardSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("supabaseAuthUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSetProgress" ADD CONSTRAINT "UserSetProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("supabaseAuthUserId") ON DELETE CASCADE ON UPDATE CASCADE;

