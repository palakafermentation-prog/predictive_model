-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('SPT_BORING', 'TEST_PIT');

-- AlterTable
ALTER TABLE "project" ADD COLUMN     "location" TEXT,
ADD COLUMN     "projectIdentifier" TEXT;

-- CreateTable
CREATE TABLE "log" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "logType" "LogType" NOT NULL,
    "logNumber" TEXT NOT NULL,
    "northing" TEXT,
    "easting" TEXT,
    "elevation" TEXT,
    "loggedBy" TEXT,
    "startDate" TEXT,
    "completionDate" TEXT,
    "initialWaterHours" TEXT,
    "initialWaterLevelFeet" TEXT,
    "finalWaterHours" TEXT,
    "finalWaterLevelFeet" TEXT,
    "drillingFirm" TEXT,
    "drillingForeman" TEXT,
    "drillHelper" TEXT,
    "excavatingFirm" TEXT,
    "operator" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_projectId_idx" ON "log"("projectId");

-- AddForeignKey
ALTER TABLE "log" ADD CONSTRAINT "log_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
