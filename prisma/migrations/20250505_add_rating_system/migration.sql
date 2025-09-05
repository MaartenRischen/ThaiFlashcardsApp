-- CreateTable
CREATE TABLE "SetRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publishedSetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SetRating_userId_publishedSetId_key" ON "SetRating"("userId", "publishedSetId");

-- CreateIndex
CREATE INDEX "SetRating_publishedSetId_idx" ON "SetRating"("publishedSetId");

-- CreateIndex
CREATE INDEX "SetRating_userId_idx" ON "SetRating"("userId");

-- AddForeignKey
ALTER TABLE "SetRating" ADD CONSTRAINT "SetRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetRating" ADD CONSTRAINT "SetRating_publishedSetId_fkey" FOREIGN KEY ("publishedSetId") REFERENCES "PublishedSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
