/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Invitation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "token" TEXT;
UPDATE "Invitation" SET "token" = md5(random()::text || clock_timestamp()::text) WHERE "token" IS NULL;
ALTER TABLE "Invitation" ALTER COLUMN "token" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
