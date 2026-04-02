/*
  Warnings:

  - The primary key for the `auth_account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `auth_account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `userId` on the `auth_account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `accountId` on the `auth_account` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - The primary key for the `auth_session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `auth_session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `userId` on the `auth_session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - The primary key for the `auth_user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `auth_user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - The primary key for the `auth_verification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `auth_verification` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - The primary key for the `media_file` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accountId` on the `media_file` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `media_file` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `createdBy` on the `media_file` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `updatedBy` on the `media_file` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currentAccountId` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `authUserId` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `avatarId` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `invitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_log_sample` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_log_strata` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_conflict` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_processed_entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "account_user" DROP CONSTRAINT "account_user_accountId_fkey";

-- DropForeignKey
ALTER TABLE "account_user" DROP CONSTRAINT "account_user_userId_fkey";

-- DropForeignKey
ALTER TABLE "auth_account" DROP CONSTRAINT "auth_account_userId_fkey";

-- DropForeignKey
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_userId_fkey";

-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_accountId_fkey";

-- DropForeignKey
ALTER TABLE "media_file" DROP CONSTRAINT "media_file_accountId_fkey";

-- DropForeignKey
ALTER TABLE "media_file" DROP CONSTRAINT "media_file_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "media_file" DROP CONSTRAINT "media_file_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_accountId_fkey";

-- DropForeignKey
ALTER TABLE "project_log" DROP CONSTRAINT "project_log_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_log_sample" DROP CONSTRAINT "project_log_sample_projectLogId_fkey";

-- DropForeignKey
ALTER TABLE "project_log_strata" DROP CONSTRAINT "project_log_strata_projectLogId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_avatarId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_currentAccountId_fkey";

-- DropIndex
DROP INDEX "media_file_accountId_idx";

-- AlterTable
ALTER TABLE "auth_account" DROP CONSTRAINT "auth_account_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "accountId" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_session" DROP CONSTRAINT "auth_session_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "userId" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_user" DROP CONSTRAINT "auth_user_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "auth_verification" DROP CONSTRAINT "auth_verification_pkey",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "media_file" DROP CONSTRAINT "media_file_pkey",
DROP COLUMN "accountId",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "createdBy" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "updatedBy" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "media_file_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "currentAccountId",
ALTER COLUMN "id" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "authUserId" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "avatarId" SET DATA TYPE VARCHAR(32),
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "account_user";

-- DropTable
DROP TABLE "invitation";

-- DropTable
DROP TABLE "project";

-- DropTable
DROP TABLE "project_log";

-- DropTable
DROP TABLE "project_log_sample";

-- DropTable
DROP TABLE "project_log_strata";

-- DropTable
DROP TABLE "sync_conflict";

-- DropTable
DROP TABLE "sync_processed_entry";

-- DropEnum
DROP TYPE "AccountUserRole";

-- DropEnum
DROP TYPE "AccountUserStatus";

-- DropEnum
DROP TYPE "InvitationStatus";

-- DropEnum
DROP TYPE "LogType";

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "media_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_file" ADD CONSTRAINT "media_file_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_file" ADD CONSTRAINT "media_file_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
