/*
  Warnings:

  - You are about to drop the column `assignTo` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `columnId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `KanbanColumn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgressUpdate` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Made the column `projectId` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "KanbanColumn" DROP CONSTRAINT "KanbanColumn_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_taskId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignTo_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_columnId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignTo",
DROP COLUMN "columnId",
DROP COLUMN "dueDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "KanbanColumnStatus" NOT NULL DEFAULT 'Todo',
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "projectId" SET NOT NULL;

-- DropTable
DROP TABLE "KanbanColumn";

-- DropTable
DROP TABLE "ProgressUpdate";

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
