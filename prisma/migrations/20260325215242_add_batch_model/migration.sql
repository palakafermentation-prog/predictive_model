-- CreateTable
CREATE TABLE "batch" (
    "id" VARCHAR(32) NOT NULL,
    "userId" VARCHAR(32) NOT NULL,
    "batchId" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "predictions" JSONB NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "qcStatus" TEXT NOT NULL,
    "qcFlags" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "batch_userId_idx" ON "batch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_userId_batchId_key" ON "batch"("userId", "batchId");

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
