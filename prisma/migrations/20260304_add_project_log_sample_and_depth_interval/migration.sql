-- AlterTable
ALTER TABLE "project_log" ADD COLUMN     "depthInterval" TEXT;

-- CreateTable
CREATE TABLE "project_log_sample" (
    "id" TEXT NOT NULL,
    "projectLogId" TEXT NOT NULL,
    "sampleNumber" INTEGER,
    "samplePrefix" TEXT,
    "depthStart" DOUBLE PRECISION,
    "depthEnd" DOUBLE PRECISION,
    "pocketPen" TEXT,
    "blowCount1" TEXT,
    "blowCount2" TEXT,
    "blowCount3" TEXT,
    "blowCount4" TEXT,
    "blow1Flag" TEXT,
    "blow2Flag" TEXT,
    "blow3Flag" TEXT,
    "blow4Flag" TEXT,
    "recovery" TEXT,
    "moisture" TEXT,
    "soilPlug" INTEGER NOT NULL DEFAULT 0,
    "augerRefusal" INTEGER NOT NULL DEFAULT 0,
    "depthIntervalOverride" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_log_sample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_log_sample_projectLogId_idx" ON "project_log_sample"("projectLogId");

-- AddForeignKey
ALTER TABLE "project_log_sample" ADD CONSTRAINT "project_log_sample_projectLogId_fkey" FOREIGN KEY ("projectLogId") REFERENCES "project_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;
