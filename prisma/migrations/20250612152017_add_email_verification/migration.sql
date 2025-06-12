-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "verificationToken" TEXT;
