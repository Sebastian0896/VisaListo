-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DocumentKind" ADD VALUE 'PASSPORT';
ALTER TYPE "DocumentKind" ADD VALUE 'NATIONAL_ID';

-- AlterTable
ALTER TABLE "ApplicationFile" ADD COLUMN     "passportVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "passportVerifiedById" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "documentRetentionDays" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "Document_kind_deletedAt_idx" ON "Document"("kind", "deletedAt");

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_passportVerifiedById_fkey" FOREIGN KEY ("passportVerifiedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
