-- Código de asesor y WhatsApp propio
ALTER TABLE "AdminUser" ADD COLUMN "advisorCode" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "whatsappNumber" TEXT;

-- Códigos para los usuarios existentes (6 caracteres hexadecimales, sin O/I/L ambiguos)
UPDATE "AdminUser" SET "advisorCode" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || "id") FROM 1 FOR 6))
WHERE "advisorCode" IS NULL;

ALTER TABLE "AdminUser" ALTER COLUMN "advisorCode" SET NOT NULL;
CREATE UNIQUE INDEX "AdminUser_advisorCode_key" ON "AdminUser"("advisorCode");

-- Asignación del expediente a un asesor
ALTER TABLE "ApplicationFile" ADD COLUMN "advisorId" TEXT;
CREATE INDEX "ApplicationFile_advisorId_idx" ON "ApplicationFile"("advisorId");
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_advisorId_fkey"
  FOREIGN KEY ("advisorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
