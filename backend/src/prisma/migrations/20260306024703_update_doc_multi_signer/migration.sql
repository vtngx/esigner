/*
  Warnings:

  - You are about to drop the `Signature` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "DocumentStatus" ADD VALUE 'SIGNING';

-- DropForeignKey
ALTER TABLE "Signature" DROP CONSTRAINT "Signature_documentId_fkey";

-- DropForeignKey
ALTER TABLE "Signature" DROP CONSTRAINT "Signature_signerId_fkey";

-- DropTable
DROP TABLE "Signature";

-- CreateTable
CREATE TABLE "Signer" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signatureHex" TEXT,
    "signedAt" TIMESTAMP(3),
    "signedWalletAddress" TEXT,

    CONSTRAINT "Signer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Signer_documentId_userId_key" ON "Signer"("documentId", "userId");

-- AddForeignKey
ALTER TABLE "Signer" ADD CONSTRAINT "Signer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signer" ADD CONSTRAINT "Signer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
