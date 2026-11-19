# VisaListo — preparación del formulario DS-160 (asesoría privada)

Plataforma web para que los solicitantes preparen la información de su formulario DS-160 con orientación en español, y para que el asesor gestione los expedientes.

> **No es el formulario DS-160 oficial**, no pertenece al Gobierno de los Estados Unidos y no envía solicitudes a ninguna institución gubernamental.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) · Lucide · PostgreSQL · Prisma 7 · Auth.js v5 · React Hook Form · Zod · Sonner · @react-pdf/renderer.

## Puesta en marcha

La base de datos es PostgreSQL en **Supabase** (proyecto de desarrollo y proyecto de producción). Copie `.env.example` a `.env` y complete `DATABASE_URL` (Transaction pooler, puerto 6543) y `DIRECT_URL` (Session pooler, puerto 5432).

```powershell
npm install
npm run db:migrate   # aplica las migraciones
npm run db:seed      # formulario v1, preguntas de seguridad y configuración
npm run dev          # http://localhost:3002
```

- Portal público: `/` · Comenzar: `/comenzar` · Recuperar: `/recuperar`
- Panel de gestión: `/admin`. Si no existe ningún Administrador, `/admin/login` muestra la **configuración inicial** para crearlo (en producción exige `ADMIN_SETUP_TOKEN`). Después, el Administrador crea asesores en «Usuarios».
- Roles: **Administrador** (todo: usuarios, configuración, formulario, auditoría) y **Asesor** (dashboard, expedientes, mensajes, notas y PDF).

## Arquitectura

```
prisma/
  schema.prisma          Modelo relacional (expedientes, plantillas versionadas, mensajes, auditoría…)
  form-definition.ts     Contenido de la versión 1 del formulario (10 secciones, orientaciones)
  seed.ts
src/
  app/(public)/          Inicio, comenzar, recuperar, privacidad
  app/portal/            Portal del cliente (resumen, formulario por secciones, revisión, mensajes, impresión)
  app/admin/             Login + panel (dashboard, expedientes, mensajes, formulario, auditoría, configuración)
  app/api/pdf/           PDF del cliente (por cookie) y administrativo (por sesión de asesor)
  actions/               Server actions (client.ts / admin.ts) — validación y autorización en servidor
  server/                Lógica de negocio: expedientes, respuestas, vigencia, guardas, PDF
  lib/                   Cifrado, hashes, sesión del cliente, auditoría, estados, formatos
  validation/            Esquemas Zod compartidos cliente/servidor
  components/            UI (shadcn), formulario dinámico, portal, panel, compartidos
```

## Reglas clave implementadas

| Regla | Dónde |
|---|---|
| Código único aleatorio (~60 bits, sin caracteres ambiguos), distinto del ID interno | `lib/code.ts` |
| Recuperación: código + primer apellido + año + respuesta de seguridad, error genérico | `server/files.ts` |
| Límites: 10 fallos/IP/15 min, bloqueo de 30 min por expediente tras 5 fallos, 10 altas/IP/hora | `server/files.ts` |
| La pregunta de seguridad no revela si el código existe (pregunta determinística si no existe) | `getRecoveryQuestion` |
| Vigencia inicia con la **primera respuesta guardada** (`startedAt`, inmutable) | `server/answers.ts` |
| Vencimiento perezoso + barrido al abrir el panel; extensión/reapertura auditadas | `applyExpiry`, `actions/admin.ts` |
| Guardado incremental con debounce, al ocultar la pestaña y antes de navegar | `components/form/section-form.tsx` |
| Edición bloqueada tras el envío hasta que el asesor reabra o solicite correcciones | `clientCanEdit` |
| Respuestas cifradas AES-256-GCM (formato versionado `v1:`); respuesta de seguridad y contraseñas con Argon2id | `lib/crypto.ts`, `lib/hash.ts` |
| Sesión del cliente en cookie httpOnly con JWE cifrado (el ID interno nunca es legible) | `lib/client-session.ts` |
| El cliente nunca pasa IDs: todo se resuelve desde su cookie | `server/guards.ts` |
| Notas internas nunca en vistas ni PDF del cliente | `api/pdf/cliente`, `portal/*` |
| Auditoría sin valores de respuestas (solo claves) | `lib/audit.ts` |
| Plantillas versionadas: cada expediente conserva su versión; orientaciones editables siempre | `admin/formulario` |

## Producción

- Servir solo por HTTPS (se envía HSTS en producción).
- `ENCRYPTION_KEY` debe gestionarse como secreto (gestor de secretos del proveedor); perderla impide leer las respuestas.
- Usar `npm run db:deploy` para migraciones.
- Revisar y **verificar** el contenido del formulario contra la referencia oficial vigente antes de marcar la versión como verificada.
