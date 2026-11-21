-- Bloquea la API REST pública de Supabase sobre la tabla nueva (Prisma usa el rol postgres)
ALTER TABLE "ProfileAssessment" ENABLE ROW LEVEL SECURITY;
