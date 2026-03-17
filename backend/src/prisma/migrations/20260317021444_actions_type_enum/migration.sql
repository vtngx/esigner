/*
  Warnings:

  - Changed the type of `action` on the `ActionLog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('USER_LOGIN', 'WALLET_CONNECT', 'DOCUMENT_CREATE', 'DOCUMENT_UPDATE_SIGNER', 'DOCUMENT_SIGN', 'DOCUMENT_EXPORT', 'DOCUMENT_DELETE');

-- AlterTable
ALTER TABLE "ActionLog" DROP COLUMN "action",
ADD COLUMN     "action" "ActionType" NOT NULL;
