-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatarId" TEXT;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "media_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;
