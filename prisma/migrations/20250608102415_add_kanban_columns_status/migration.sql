/*
  Warnings:

  - The `name` column on the `KanbanColumn` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "KanbanColumnStatus" AS ENUM ('Todo', 'InProgress', 'Done');

-- AlterTable
ALTER TABLE "KanbanColumn" DROP COLUMN "name",
ADD COLUMN     "name" "KanbanColumnStatus" NOT NULL DEFAULT 'Todo';
