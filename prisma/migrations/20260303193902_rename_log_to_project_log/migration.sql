-- RenameTable (manually edited: use ALTER RENAME to preserve data)
ALTER TABLE "log" RENAME TO "project_log";

-- RenamePrimaryKey
ALTER TABLE "project_log" RENAME CONSTRAINT "log_pkey" TO "project_log_pkey";

-- RenameIndex
ALTER INDEX "log_projectId_idx" RENAME TO "project_log_projectId_idx";

-- RenameForeignKey
ALTER TABLE "project_log" RENAME CONSTRAINT "log_projectId_fkey" TO "project_log_projectId_fkey";
