-- AlterTable
ALTER TABLE "project_log_sample" ADD COLUMN     "rqd" TEXT,
ADD COLUMN     "sampleType" TEXT NOT NULL DEFAULT 'SOIL';

-- CreateTable
CREATE TABLE "project_log_strata" (
    "id" TEXT NOT NULL,
    "projectLogId" TEXT NOT NULL,
    "strataType" TEXT NOT NULL DEFAULT 'SOIL',
    "depthStart" DOUBLE PRECISION NOT NULL,
    "depthEnd" DOUBLE PRECISION NOT NULL,
    "primaryType" TEXT,
    "andedType" TEXT,
    "someType" TEXT,
    "littleType" TEXT,
    "traceType" TEXT,
    "gravelCodes" TEXT,
    "sandCodes" TEXT,
    "siltCodes" TEXT,
    "clayCodes" TEXT,
    "colorGley2Codes" TEXT,
    "color10RCodes" TEXT,
    "color2_5YRCodes" TEXT,
    "color5YRCodes" TEXT,
    "color7_5YRCodes" TEXT,
    "color10YRCodes" TEXT,
    "color5YCodes" TEXT,
    "color2_5YCodes" TEXT,
    "modifierCodes" TEXT,
    "structureCodes" TEXT,
    "depositCodes" TEXT,
    "userDefinedModifier" TEXT,
    "rockType1Codes" TEXT,
    "rockType2Codes" TEXT,
    "rockType3Codes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "project_log_strata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_log_strata_projectLogId_idx" ON "project_log_strata"("projectLogId");

-- AddForeignKey
ALTER TABLE "project_log_strata" ADD CONSTRAINT "project_log_strata_projectLogId_fkey" FOREIGN KEY ("projectLogId") REFERENCES "project_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;
