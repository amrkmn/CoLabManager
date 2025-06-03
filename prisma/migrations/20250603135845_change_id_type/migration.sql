/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Message` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ProgressUpdate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Project` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Task` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_projectId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_uploadedBy_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_taskId_fkey";

-- DropForeignKey
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assignTo_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_projectId_fkey";

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "uploadedBy" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "File_id_seq";

-- AlterTable
ALTER TABLE "Message" DROP CONSTRAINT "Message_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "senderId" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Message_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Message_id_seq";

-- AlterTable
ALTER TABLE "ProgressUpdate" DROP CONSTRAINT "ProgressUpdate_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "updatedBy" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ALTER COLUMN "taskId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ProgressUpdate_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ProgressUpdate_id_seq";

-- AlterTable
ALTER TABLE "Project" DROP CONSTRAINT "Project_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdBy" SET DATA TYPE TEXT,
ADD CONSTRAINT "Project_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Project_id_seq";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Task" DROP CONSTRAINT "Task_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "assignTo" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Task_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Task_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignTo_fkey" FOREIGN KEY ("assignTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressUpdate" ADD CONSTRAINT "ProgressUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
