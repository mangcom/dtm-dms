/*
  Warnings:

  - You are about to drop the column `requiredRole` on the `approval_steps` table. All the data in the column will be lost.
  - Added the required column `positionType` to the `approval_steps` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PositionType" AS ENUM ('teacher', 'dept_head', 'work_section_head', 'curriculum_head', 'deputy_academic', 'deputy_plan', 'deputy_resource', 'deputy_student_affairs', 'director', 'admin');

-- AlterTable
ALTER TABLE "approval_steps" DROP COLUMN "requiredRole",
ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "positionType" "PositionType" NOT NULL,
ADD COLUMN     "workSectionId" TEXT;

-- AlterTable
ALTER TABLE "materials" ADD COLUMN     "description" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "source" TEXT;

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "departmentId" TEXT;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_sections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "managesMaterials" BOOLEAN NOT NULL DEFAULT false,
    "isProcurementReview" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "positionType" "PositionType" NOT NULL,
    "departmentId" TEXT,
    "workSectionId" TEXT,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "position_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "work_sections_name_key" ON "work_sections"("name");

-- CreateIndex
CREATE INDEX "position_assignments_userId_idx" ON "position_assignments"("userId");

-- CreateIndex
CREATE INDEX "position_assignments_positionType_idx" ON "position_assignments"("positionType");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignments" ADD CONSTRAINT "position_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignments" ADD CONSTRAINT "position_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignments" ADD CONSTRAINT "position_assignments_workSectionId_fkey" FOREIGN KEY ("workSectionId") REFERENCES "work_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workSectionId_fkey" FOREIGN KEY ("workSectionId") REFERENCES "work_sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
