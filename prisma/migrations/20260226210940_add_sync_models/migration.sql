-- AlterTable
ALTER TABLE "account" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "sync_conflict" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "localVersion" INTEGER NOT NULL,
    "serverVersion" INTEGER NOT NULL,
    "localData" JSONB NOT NULL,
    "serverData" JSONB NOT NULL,
    "resolvedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_conflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_processed_entry" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "processedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_processed_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_conflict_tableName_recordId_idx" ON "sync_conflict"("tableName", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "sync_processed_entry_entryId_key" ON "sync_processed_entry"("entryId");
