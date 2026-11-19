-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'ADVISOR');

-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADVISOR';

-- El usuario más antiguo pasa a ser Administrador (en desarrollo: el creado por el seed)
UPDATE "AdminUser" SET "role" = 'ADMIN'
WHERE "id" = (SELECT "id" FROM "AdminUser" ORDER BY "createdAt" ASC LIMIT 1);
