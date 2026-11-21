-- CreateTable
CREATE TABLE "ProfileAssessment" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "dataEnc" TEXT NOT NULL,
    "hasFlags" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileAssessment_applicationFileId_createdAt_idx" ON "ProfileAssessment"("applicationFileId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileAssessment" ADD CONSTRAINT "ProfileAssessment_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
