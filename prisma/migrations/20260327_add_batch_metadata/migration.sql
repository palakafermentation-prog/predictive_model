-- Add model and schema version metadata to batch records
ALTER TABLE "batch" ADD COLUMN "modelVersion" TEXT;
ALTER TABLE "batch" ADD COLUMN "schemaVersion" TEXT;
