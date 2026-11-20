-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ApplicationFile" ADD COLUMN     "expiryWarningSentAt" TIMESTAMP(3);
