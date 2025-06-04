/*
  Warnings:

  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - Added the required column `columnId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "status",
ADD COLUMN     "columnId" TEXT NOT NULL,
ALTER COLUMN "projectId" DROP NOT NULL;

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "KanbanColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "KanbanColumn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KanbanColumn" ADD CONSTRAINT "KanbanColumn_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
