import "dotenv/config";
import { defineConfig } from "prisma/config";

// La CLI de Prisma (migraciones, seed, studio) usa la conexión directa si existe.
// La app usa DATABASE_URL (en Supabase: el pooler, puerto 6543) desde src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
