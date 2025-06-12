/*
  Warnings:

  - Changed the type of `role` on the `ProjectMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "role",
ADD COLUMN     "role" "ProjectMemberRole" NOT NULL;
