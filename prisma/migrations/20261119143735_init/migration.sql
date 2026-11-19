-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING_START', 'IN_PROGRESS', 'SUBMITTED', 'IN_REVIEW', 'NEEDS_CORRECTIONS', 'REOPENED', 'REVIEWED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('CLIENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('CLIENT', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'DATE', 'NUMBER', 'SELECT', 'RADIO', 'YESNO', 'COUNTRY', 'GROUP');

-- CreateEnum
CREATE TYPE "TemplateVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVED', 'CORRECTIONS_REQUESTED');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('CLIENT_PDF', 'ADMIN_PDF', 'UPLOAD');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platformName" TEXT NOT NULL DEFAULT 'VisaListo',
    "logoUrl" TEXT,
    "whatsappNumber" TEXT,
    "whatsappMessage" TEXT NOT NULL DEFAULT 'Hola, estoy completando mi formulario de preparación y necesito asistencia. Mi código de expediente es: {codigo}',
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "expiryWarningDays" INTEGER NOT NULL DEFAULT 5,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Bienvenido. Complete su información con calma; su progreso se guarda automáticamente.',
    "expiryMessage" TEXT NOT NULL DEFAULT 'El período de vigencia de su formulario terminó. Comuníquese con su asesor para solicitar una extensión.',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactAddress" TEXT,
    "officeHours" TEXT,
    "aboutText" TEXT NOT NULL DEFAULT 'Le acompañamos en la preparación de la información que necesitará para su solicitud de visa, con orientación clara en español.',
    "privacyPolicy" TEXT NOT NULL DEFAULT '',
    "privacyVersion" TEXT NOT NULL DEFAULT '2026-11',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTemplateVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TemplateVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notice" TEXT,

    CONSTRAINT "FormSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormQuestion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "config" JSONB,
    "showIf" JSONB,

    CONSTRAINT "FormQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "FormOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpContent" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "guidance" TEXT NOT NULL,
    "example" TEXT,
    "notApplicable" TEXT,
    "warning" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SecurityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "verifySurname" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "firstSurname" TEXT NOT NULL,
    "givenNames" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFile" (
    "id" TEXT NOT NULL,
    "uniqueCode" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "templateVersionId" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING_START',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validityDays" INTEGER,
    "securityQuestionId" TEXT NOT NULL,
    "securityAnswerHash" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "correctionRequest" TEXT,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSection" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "answeredRequired" INTEGER NOT NULL DEFAULT 0,
    "totalRequired" INTEGER NOT NULL DEFAULT 0,
    "answeredCount" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAnswer" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "valueEnc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "adminUserId" TEXT,
    "message" TEXT NOT NULL,
    "isSubmissionNote" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNote" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "adminUserId" TEXT,
    "outcome" "ReviewOutcome" NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdByType" "ActorType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "applicationFileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryAttempt" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'recovery',
    "ipHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplate_slug_key" ON "FormTemplate"("slug");

-- CreateIndex
CREATE INDEX "FormTemplateVersion_status_idx" ON "FormTemplateVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FormTemplateVersion_templateId_version_key" ON "FormTemplateVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "FormSection_templateVersionId_order_idx" ON "FormSection"("templateVersionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FormSection_templateVersionId_key_key" ON "FormSection"("templateVersionId", "key");

-- CreateIndex
CREATE INDEX "FormQuestion_sectionId_order_idx" ON "FormQuestion"("sectionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "FormQuestion_sectionId_key_key" ON "FormQuestion"("sectionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "FormOption_questionId_value_key" ON "FormOption"("questionId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "HelpContent_questionId_key" ON "HelpContent"("questionId");

-- CreateIndex
CREATE INDEX "Applicant_firstSurname_idx" ON "Applicant"("firstSurname");

-- CreateIndex
CREATE INDEX "Applicant_givenNames_idx" ON "Applicant"("givenNames");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationFile_uniqueCode_key" ON "ApplicationFile"("uniqueCode");

-- CreateIndex
CREATE INDEX "ApplicationFile_status_idx" ON "ApplicationFile"("status");

-- CreateIndex
CREATE INDEX "ApplicationFile_createdAt_idx" ON "ApplicationFile"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationFile_startedAt_idx" ON "ApplicationFile"("startedAt");

-- CreateIndex
CREATE INDEX "ApplicationFile_submittedAt_idx" ON "ApplicationFile"("submittedAt");

-- CreateIndex
CREATE INDEX "ApplicationFile_expiresAt_idx" ON "ApplicationFile"("expiresAt");

-- CreateIndex
CREATE INDEX "ApplicationFile_lastActivityAt_idx" ON "ApplicationFile"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationSection_applicationFileId_sectionId_key" ON "ApplicationSection"("applicationFileId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationAnswer_applicationFileId_questionId_key" ON "ApplicationAnswer"("applicationFileId", "questionId");

-- CreateIndex
CREATE INDEX "Message_applicationFileId_createdAt_idx" ON "Message"("applicationFileId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderType_readAt_idx" ON "Message"("senderType", "readAt");

-- CreateIndex
CREATE INDEX "InternalNote_applicationFileId_createdAt_idx" ON "InternalNote"("applicationFileId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_applicationFileId_idx" ON "Review"("applicationFileId");

-- CreateIndex
CREATE INDEX "Document_applicationFileId_idx" ON "Document"("applicationFileId");

-- CreateIndex
CREATE INDEX "AuditLog_applicationFileId_createdAt_idx" ON "AuditLog"("applicationFileId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_applicationFileId_idx" ON "ConsentRecord"("applicationFileId");

-- CreateIndex
CREATE INDEX "RecoveryAttempt_kind_ipHash_createdAt_idx" ON "RecoveryAttempt"("kind", "ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "FormTemplateVersion" ADD CONSTRAINT "FormTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "FormTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormSection" ADD CONSTRAINT "FormSection_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "FormTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormQuestion" ADD CONSTRAINT "FormQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormOption" ADD CONSTRAINT "FormOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpContent" ADD CONSTRAINT "HelpContent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "FormTemplateVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_securityQuestionId_fkey" FOREIGN KEY ("securityQuestionId") REFERENCES "SecurityQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSection" ADD CONSTRAINT "ApplicationSection_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSection" ADD CONSTRAINT "ApplicationSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAnswer" ADD CONSTRAINT "ApplicationAnswer_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAnswer" ADD CONSTRAINT "ApplicationAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "FormQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_applicationFileId_fkey" FOREIGN KEY ("applicationFileId") REFERENCES "ApplicationFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
