-- CreateTable
CREATE TABLE "UserMnemonic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "phraseIndex" INTEGER NOT NULL,
    "mnemonic" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMnemonic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMnemonic_userId_setId_phraseIndex_key" ON "UserMnemonic"("userId", "setId", "phraseIndex");

-- CreateIndex
CREATE INDEX "UserMnemonic_userId_idx" ON "UserMnemonic"("userId");

-- CreateIndex
CREATE INDEX "UserMnemonic_setId_idx" ON "UserMnemonic"("setId");

-- AddForeignKey
ALTER TABLE "UserMnemonic" ADD CONSTRAINT "UserMnemonic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
