import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { DEFAULT_PRIVACY_POLICY, FORM_V1, SECURITY_QUESTIONS } from "./form-definition";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  // 1. Configuración
  await db.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, privacyPolicy: DEFAULT_PRIVACY_POLICY, whatsappNumber: process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP || null },
    update: {},
  });

  // 2. Preguntas de seguridad
  if ((await db.securityQuestion.count()) === 0) {
    await db.securityQuestion.createMany({ data: SECURITY_QUESTIONS.map((text, order) => ({ text, order })) });
  }

  // 3. Usuarios: el primer Administrador se crea desde /admin/login (configuración inicial).

  // 4. Plantilla del formulario v1
  const template = await db.formTemplate.upsert({
    where: { slug: "ds160-prep" },
    create: { slug: "ds160-prep", name: "Preparación DS-160", description: "Formulario de preparación de información para solicitud de visa de no inmigrante." },
    update: {},
  });
  const existing = await db.formTemplateVersion.findUnique({ where: { templateId_version: { templateId: template.id, version: 1 } } });
  if (existing) {
    console.log("La versión 1 del formulario ya existe; no se modifica.");
    return;
  }

  await db.$transaction(
    async (tx) => {
      const version = await tx.formTemplateVersion.create({
        data: {
          templateId: template.id,
          version: 1,
          status: "PUBLISHED",
          publishedAt: new Date(),
          notes: "Versión inicial. Pendiente de verificación contra la referencia oficial vigente.",
        },
      });
      for (const [si, s] of FORM_V1.entries()) {
        const section = await tx.formSection.create({
          data: { templateVersionId: version.id, key: s.key, order: si + 1, title: s.title, description: s.description, notice: s.notice },
        });
        for (const [qi, q] of s.questions.entries()) {
          await tx.formQuestion.create({
            data: {
              sectionId: section.id,
              key: q.key,
              order: qi + 1,
              label: q.label,
              type: q.type,
              required: q.required ?? false,
              sensitive: q.sensitive ?? false,
              placeholder: q.placeholder,
              config: (q.config ?? undefined) as Prisma.InputJsonValue | undefined,
              showIf: (q.showIf ?? undefined) as Prisma.InputJsonValue | undefined,
              options: q.options ? { create: q.options.map((o, oi) => ({ value: o.value, label: o.label, order: oi })) } : undefined,
              help: { create: { guidance: q.help.guidance, example: q.help.example, notApplicable: q.help.notApplicable, warning: q.help.warning } },
            },
          });
        }
      }
      console.log(`Formulario v1 creado: ${FORM_V1.length} secciones, ${FORM_V1.reduce((n, s) => n + s.questions.length, 0)} preguntas.`);
    },
    { timeout: 120_000 },
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
