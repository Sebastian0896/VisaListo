/**
 * Definición inicial (versión 1) del formulario de preparación.
 * Redacción propia en español, organizada por los temas de información que aborda el proceso DS-160.
 * NO es una reproducción del formulario oficial. El asesor debe verificar el contenido contra la
 * referencia oficial vigente antes de marcar la versión como verificada.
 */
import type { GroupFieldDef, HelpDef, OptionDef, QType, QuestionConfig, ShowIf } from "../src/lib/form-types";

export type QuestionDef = {
  key: string;
  label: string;
  type: QType;
  required?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  config?: QuestionConfig;
  showIf?: ShowIf;
  options?: OptionDef[];
  help: HelpDef;
};

export type SectionDef = {
  key: string;
  title: string;
  description: string;
  notice?: string;
  questions: QuestionDef[];
};

const opts = (...pairs: [string, string][]): OptionDef[] => pairs.map(([value, label]) => ({ value, label }));
const yes = (question: string): ShowIf => ({ question, equals: "yes" });
const no = (question: string): ShowIf => ({ question, equals: "no" });

/** Pregunta Sí/No + campo de explicación que aparece al responder "Sí". */
function yesNoExplain(key: string, label: string, help: HelpDef, explainHelp?: string): QuestionDef[] {
  return [
    { key, label, type: "YESNO", required: true, help },
    {
      key: `${key}_explain`,
      label: "Explique los detalles",
      type: "TEXTAREA",
      required: true,
      showIf: yes(key),
      help: {
        guidance: explainHelp ?? "Describa la situación con fechas aproximadas, lugares y cómo se resolvió. Su asesor revisará esta información con usted.",
        warning: "Sea completo y honesto. Las respuestas incompletas o contradictorias pueden causar problemas en el proceso oficial.",
      },
    },
  ];
}

const RELATIONSHIP = opts(
  ["spouse", "Cónyuge / pareja"],
  ["child", "Hijo(a)"],
  ["parent", "Padre / madre"],
  ["sibling", "Hermano(a)"],
  ["relative", "Otro familiar"],
  ["friend", "Amigo(a)"],
  ["colleague", "Compañero(a) de trabajo"],
  ["other", "Otro"],
);

const US_STATUS = opts(
  ["citizen", "Ciudadano(a) estadounidense"],
  ["lpr", "Residente permanente (green card)"],
  ["nonimmigrant", "Con visa temporal (no inmigrante)"],
  ["other", "Otro / no sé"],
);

const DATE_FIELDS = (prefix = ""): GroupFieldDef[] => [
  { key: `${prefix}start`, label: "Desde", type: "DATE" },
  { key: `${prefix}end`, label: "Hasta", type: "DATE" },
];

export const FORM_V1: SectionDef[] = [
  // ───────────────────────────── 1. Información personal ─────────────────────────────
  {
    key: "personal",
    title: "Información personal",
    description: "Sus datos de identidad tal como aparecen en su pasaporte.",
    questions: [
      {
        key: "surnames",
        label: "Apellidos",
        type: "TEXT",
        required: true,
        config: { maxLength: 80 },
        help: {
          guidance: "Escriba todos sus apellidos exactamente como aparecen en su pasaporte, sin abreviaturas.",
          example: "RODRÍGUEZ MARTÍNEZ",
          warning: "Si su pasaporte muestra un solo apellido, escriba solo ese. No agregue apellidos que no figuren en el pasaporte.",
        },
      },
      {
        key: "given_names",
        label: "Nombres",
        type: "TEXT",
        required: true,
        config: { maxLength: 80 },
        help: {
          guidance: "Escriba todos sus nombres tal como figuran en el pasaporte.",
          example: "ANA MARÍA",
        },
      },
      {
        key: "native_full_name",
        label: "Nombre completo en su alfabeto nativo",
        type: "TEXT",
        config: { maxLength: 120 },
        help: {
          guidance: "Solo aplica si su idioma usa un alfabeto distinto al latino (por ejemplo: árabe, chino, ruso).",
          notApplicable: "Si su nombre se escribe con el alfabeto latino (como en español), deje este campo vacío.",
        },
      },
      {
        key: "has_other_names",
        label: "¿Ha usado otros nombres o apellidos?",
        type: "YESNO",
        required: true,
        help: {
          guidance: "Incluya apellidos de soltera o de casada, nombres anteriores a un cambio legal, alias o nombres religiosos.",
          example: "Una persona que antes usaba el apellido de su esposo debe responder «Sí».",
        },
      },
      {
        key: "other_names",
        label: "Otros nombres utilizados",
        type: "GROUP",
        required: true,
        showIf: yes("has_other_names"),
        config: {
          addLabel: "Agregar otro nombre",
          maxItems: 6,
          fields: [
            { key: "surnames", label: "Apellidos", type: "TEXT", required: true },
            { key: "given_names", label: "Nombres", type: "TEXT", required: true },
          ],
        },
        help: { guidance: "Agregue cada nombre o apellido distinto que haya utilizado." },
      },
      {
        key: "sex",
        label: "Sexo",
        type: "RADIO",
        required: true,
        options: opts(["M", "Masculino"], ["F", "Femenino"]),
        help: { guidance: "Indique el sexo tal como aparece en su pasaporte." },
      },
      {
        key: "marital_status",
        label: "Estado civil",
        type: "SELECT",
        required: true,
        options: opts(
          ["single", "Soltero(a)"],
          ["married", "Casado(a)"],
          ["common_law", "Unión libre"],
          ["civil_union", "Unión civil / pareja de hecho registrada"],
          ["widowed", "Viudo(a)"],
          ["divorced", "Divorciado(a)"],
          ["separated", "Separado(a) legalmente"],
          ["other", "Otro"],
        ),
        help: {
          guidance: "Seleccione su situación actual.",
          warning: "«Unión libre» se refiere a una convivencia estable sin matrimonio. Si tiene dudas sobre cuál aplica, consulte a su asesor.",
        },
      },
      {
        key: "birth_date",
        label: "Fecha de nacimiento",
        type: "DATE",
        required: true,
        config: { past: true },
        help: { guidance: "Debe coincidir con la fecha de su pasaporte." },
      },
      {
        key: "birth_city",
        label: "Ciudad de nacimiento",
        type: "TEXT",
        required: true,
        help: { guidance: "Ciudad o municipio donde nació.", example: "Santiago de los Caballeros" },
      },
      {
        key: "birth_state",
        label: "Provincia o estado de nacimiento",
        type: "TEXT",
        help: {
          guidance: "Provincia, estado o departamento donde nació.",
          example: "Santiago",
          notApplicable: "Si no lo conoce o no aplica, déjelo vacío y coméntelo a su asesor.",
        },
      },
      {
        key: "birth_country",
        label: "País de nacimiento",
        type: "COUNTRY",
        required: true,
        help: { guidance: "País donde nació, aunque hoy tenga otra nacionalidad." },
      },
      {
        key: "nationality",
        label: "Nacionalidad",
        type: "COUNTRY",
        required: true,
        help: { guidance: "País del pasaporte con el que viajará." },
      },
      {
        key: "has_other_nationality",
        label: "¿Tiene o ha tenido otra nacionalidad?",
        type: "YESNO",
        required: true,
        help: { guidance: "Responda «Sí» si es o fue ciudadano(a) de otro país además del anterior, aunque no tenga pasaporte de ese país." },
      },
      {
        key: "other_nationalities",
        label: "Otras nacionalidades",
        type: "GROUP",
        required: true,
        showIf: yes("has_other_nationality"),
        config: {
          addLabel: "Agregar nacionalidad",
          maxItems: 4,
          fields: [
            { key: "country", label: "País", type: "COUNTRY", required: true },
            { key: "has_passport", label: "¿Tiene pasaporte de ese país?", type: "YESNO", required: true },
            { key: "passport_number", label: "Número de pasaporte (si tiene)", type: "TEXT" },
          ],
        },
        help: { guidance: "Agregue cada nacionalidad adicional." },
      },
      {
        key: "other_permanent_residence",
        label: "¿Es residente permanente de un país distinto a su nacionalidad?",
        type: "YESNO",
        required: true,
        help: { guidance: "Por ejemplo, si es dominicano pero tiene residencia permanente en España, responda «Sí»." },
      },
      {
        key: "permanent_residence_countries",
        label: "País(es) de residencia permanente",
        type: "TEXT",
        required: true,
        showIf: yes("other_permanent_residence"),
        help: { guidance: "Escriba el o los países donde tiene residencia permanente.", example: "España" },
      },
      {
        key: "national_id",
        label: "Número de identificación nacional",
        type: "TEXT",
        sensitive: true,
        config: { maxLength: 40, idFormat: "cedula_do" },
        help: {
          guidance: "Número de su documento de identidad nacional (por ejemplo, la cédula).",
          example: "001-1234567-3",
          notApplicable: "Si su país no emite documento de identidad nacional, déjelo vacío.",
        },
      },
      {
        key: "us_ssn",
        label: "Número de Seguro Social de EE. UU.",
        type: "TEXT",
        sensitive: true,
        config: { maxLength: 15 },
        help: {
          guidance: "Solo si alguna vez le asignaron un número de Seguro Social estadounidense.",
          notApplicable: "La mayoría de los solicitantes no tiene uno. En ese caso, déjelo vacío.",
        },
      },
      {
        key: "us_taxpayer_id",
        label: "Número de identificación tributaria de EE. UU.",
        type: "TEXT",
        sensitive: true,
        config: { maxLength: 15 },
        help: {
          guidance: "Solo si tiene un número de contribuyente de EE. UU. (ITIN).",
          notApplicable: "Si no tiene, déjelo vacío.",
        },
      },
    ],
  },

  // ───────────────────────────── 2. Contacto y domicilio ─────────────────────────────
  {
    key: "contact",
    title: "Contacto y domicilio",
    description: "Dónde vive actualmente y cómo podemos comunicarnos con usted.",
    questions: [
      {
        key: "home_street",
        label: "Dirección residencial (calle y número)",
        type: "TEXT",
        required: true,
        help: { guidance: "Dirección donde vive actualmente.", example: "Calle Duarte #45, Edif. Las Palmas, Apto. 3B" },
      },
      { key: "home_sector", label: "Sector o barrio", type: "TEXT", help: { guidance: "Sector, barrio o urbanización.", example: "Los Jardines" } },
      { key: "home_city", label: "Ciudad", type: "TEXT", required: true, help: { guidance: "Ciudad o municipio.", example: "Santo Domingo Este" } },
      { key: "home_state", label: "Provincia o estado", type: "TEXT", required: true, help: { guidance: "Provincia, estado o departamento.", example: "Santo Domingo" } },
      {
        key: "home_postal",
        label: "Código postal",
        type: "TEXT",
        help: { guidance: "Si conoce el código postal de su zona, escríbalo.", notApplicable: "Si no lo sabe o no se usa en su zona, déjelo vacío." },
      },
      { key: "home_country", label: "País de residencia", type: "COUNTRY", required: true, help: { guidance: "País donde vive actualmente." } },
      {
        key: "mailing_same",
        label: "¿Su dirección postal es la misma que la residencial?",
        type: "YESNO",
        required: true,
        help: { guidance: "La dirección postal es donde recibe correspondencia. Para la mayoría de las personas es la misma." },
      },
      {
        key: "mailing_address",
        label: "Dirección postal completa",
        type: "TEXTAREA",
        required: true,
        showIf: no("mailing_same"),
        help: { guidance: "Escriba la dirección completa donde recibe correspondencia: calle, ciudad, provincia y país." },
      },
      {
        key: "primary_phone",
        label: "Teléfono principal",
        type: "PHONE",
        required: true,
        help: { guidance: "Número donde se le pueda localizar con facilidad. Incluya el código de país.", example: "+1 809 555 1234" },
      },
      { key: "secondary_phone", label: "Teléfono secundario", type: "PHONE", help: { guidance: "Otro número de contacto, si tiene.", notApplicable: "Si no tiene otro número, déjelo vacío." } },
      { key: "work_phone", label: "Teléfono del trabajo", type: "PHONE", help: { guidance: "Número de su lugar de trabajo.", notApplicable: "Si no trabaja o no tiene, déjelo vacío." } },
      {
        key: "other_phones_used",
        label: "¿Ha usado otros números de teléfono en los últimos cinco años?",
        type: "YESNO",
        required: true,
        help: { guidance: "Incluya números que ya no usa pero que tuvo durante los últimos cinco años." },
      },
      {
        key: "other_phones",
        label: "Otros números usados",
        type: "TEXTAREA",
        required: true,
        showIf: yes("other_phones_used"),
        help: { guidance: "Escriba un número por línea.", example: "+1 829 555 0000\n+1 849 555 1111" },
      },
      {
        key: "email",
        label: "Correo electrónico principal",
        type: "EMAIL",
        required: true,
        help: {
          guidance: "Un correo que revise con frecuencia.",
          example: "nombre.apellido@correo.com",
          warning: "Este correo es solo para el formulario de preparación; no se usa para acceder a la plataforma.",
        },
      },
      {
        key: "other_emails_used",
        label: "¿Ha usado otros correos electrónicos en los últimos cinco años?",
        type: "YESNO",
        required: true,
        help: { guidance: "Incluya correos personales o de trabajo que haya usado en los últimos cinco años." },
      },
      {
        key: "other_emails",
        label: "Otros correos usados",
        type: "TEXTAREA",
        required: true,
        showIf: yes("other_emails_used"),
        help: { guidance: "Escriba un correo por línea." },
      },
      {
        key: "social_media",
        label: "Redes sociales usadas en los últimos cinco años",
        type: "GROUP",
        config: {
          addLabel: "Agregar red social",
          maxItems: 10,
          fields: [
            {
              key: "platform",
              label: "Plataforma",
              type: "SELECT",
              required: true,
              options: opts(
                ["facebook", "Facebook"],
                ["instagram", "Instagram"],
                ["x", "X (Twitter)"],
                ["tiktok", "TikTok"],
                ["linkedin", "LinkedIn"],
                ["youtube", "YouTube"],
                ["other", "Otra"],
              ),
            },
            { key: "handle", label: "Usuario o enlace", type: "TEXT", required: true, placeholder: "@usuario" },
          ],
        },
        help: {
          guidance: "Agregue cada cuenta de red social que haya usado en los últimos cinco años, con su nombre de usuario.",
          notApplicable: "Si no usa redes sociales, deje la lista vacía.",
          warning: "No escriba contraseñas. Solo el nombre de usuario o el enlace al perfil.",
        },
      },
    ],
  },

  // ───────────────────────────── 3. Pasaporte ─────────────────────────────
  {
    key: "passport",
    title: "Pasaporte",
    description: "Datos del pasaporte vigente con el que viajará.",
    questions: [
      {
        key: "passport_type",
        label: "Tipo de pasaporte",
        type: "SELECT",
        required: true,
        options: opts(["regular", "Ordinario"], ["official", "Oficial"], ["diplomatic", "Diplomático"], ["other", "Otro"]),
        help: { guidance: "La mayoría de las personas tiene pasaporte ordinario." },
      },
      {
        key: "passport_number",
        label: "Número de pasaporte",
        type: "TEXT",
        required: true,
        sensitive: true,
        config: { maxLength: 20 },
        help: {
          guidance: "Copie el número exactamente como aparece en la página de datos del pasaporte.",
          example: "RD1234567",
          warning: "Revise con cuidado letras y números parecidos (O y 0, I y 1).",
        },
      },
      {
        key: "passport_book_number",
        label: "Número de libreta del pasaporte",
        type: "TEXT",
        config: { maxLength: 20 },
        help: {
          guidance: "Algunos pasaportes tienen un número de libreta o inventario distinto al número de pasaporte.",
          notApplicable: "Si su pasaporte no lo tiene, déjelo vacío.",
        },
      },
      { key: "passport_country", label: "País que emitió el pasaporte", type: "COUNTRY", required: true, help: { guidance: "País o autoridad que emitió el pasaporte." } },
      { key: "passport_issue_city", label: "Ciudad de expedición", type: "TEXT", required: true, help: { guidance: "Ciudad donde se expidió el pasaporte.", example: "Santo Domingo" } },
      { key: "passport_issue_country", label: "País de expedición", type: "COUNTRY", required: true, help: { guidance: "País donde se expidió (puede ser distinto si lo obtuvo en un consulado)." } },
      { key: "passport_issue_date", label: "Fecha de expedición", type: "DATE", required: true, config: { past: true }, help: { guidance: "Fecha en que se emitió el pasaporte." } },
      {
        key: "passport_expiry_date",
        label: "Fecha de vencimiento",
        type: "DATE",
        required: true,
        config: { future: true },
        help: {
          guidance: "Fecha en que vence el pasaporte.",
          warning: "Si su pasaporte vence pronto, consulte a su asesor: puede ser necesario renovarlo antes de continuar.",
        },
      },
      {
        key: "passport_lost",
        label: "¿Alguna vez ha perdido un pasaporte o se lo han robado?",
        type: "YESNO",
        required: true,
        help: { guidance: "Incluya pasaportes de cualquier país." },
      },
      {
        key: "passport_lost_details",
        label: "Detalles del pasaporte perdido o robado",
        type: "TEXTAREA",
        required: true,
        showIf: yes("passport_lost"),
        help: { guidance: "Indique el número (si lo recuerda), país emisor y una breve explicación de lo ocurrido." },
      },
      {
        key: "previous_passports",
        label: "Pasaportes anteriores",
        type: "GROUP",
        config: {
          addLabel: "Agregar pasaporte anterior",
          maxItems: 5,
          fields: [
            { key: "number", label: "Número", type: "TEXT" },
            { key: "country", label: "País emisor", type: "COUNTRY" },
            { key: "expiry", label: "Fecha de vencimiento", type: "DATE" },
          ],
        },
        help: {
          guidance: "Si tuvo pasaportes anteriores, agréguelos. Son útiles si viajó a EE. UU. con ellos.",
          notApplicable: "Si este es su primer pasaporte, deje la lista vacía.",
        },
      },
    ],
  },

  // ───────────────────────────── 4. Viaje ─────────────────────────────
  {
    key: "travel",
    title: "Información del viaje",
    description: "Motivo y planes de su viaje a Estados Unidos.",
    questions: [
      {
        key: "trip_purpose",
        label: "Motivo principal del viaje",
        type: "SELECT",
        required: true,
        options: opts(
          ["tourism", "Turismo / visita familiar / tratamiento médico"],
          ["business", "Negocios (reuniones, conferencias)"],
          ["study", "Estudios"],
          ["exchange", "Intercambio (cultural, académico, de trabajo)"],
          ["temp_work", "Trabajo temporal"],
          ["transit", "Tránsito"],
          ["crew", "Tripulación (aérea o marítima)"],
          ["other", "Otro"],
        ),
        help: {
          guidance: "Elija el motivo principal. Si viaja por varias razones, indique la más importante y coméntelo a su asesor.",
          example: "Visitar a un familiar y conocer la ciudad → Turismo / visita familiar.",
        },
      },
      {
        key: "visa_category",
        label: "Tipo de visa que considera solicitar",
        type: "SELECT",
        required: true,
        options: opts(
          ["B1B2", "B1/B2 – Negocios y turismo"],
          ["F1", "F-1 – Estudiante académico"],
          ["J1", "J-1 – Visitante de intercambio"],
          ["H2", "H-2A / H-2B – Trabajo temporal"],
          ["C1D", "C-1/D – Tránsito / tripulación"],
          ["other", "Otra"],
          ["unsure", "No estoy seguro(a)"],
        ),
        help: {
          guidance: "Indique la categoría que cree que corresponde. Su asesor la confirmará.",
          notApplicable: "Si no lo sabe, elija «No estoy seguro(a)».",
        },
      },
      {
        key: "visa_category_other",
        label: "Especifique el tipo de visa",
        type: "TEXT",
        required: true,
        showIf: { question: "visa_category", equals: "other" },
        help: { guidance: "Escriba la categoría de visa que desea solicitar." },
      },
      {
        key: "has_travel_plans",
        label: "¿Ya tiene fechas concretas de viaje?",
        type: "YESNO",
        required: true,
        help: { guidance: "Responda «Sí» si ya conoce la fecha de llegada (aunque no tenga boletos comprados)." },
      },
      {
        key: "arrival_date",
        label: "Fecha estimada de llegada",
        type: "DATE",
        required: true,
        config: { future: true },
        showIf: yes("has_travel_plans"),
        help: { guidance: "Fecha aproximada en que piensa llegar a EE. UU." },
      },
      {
        key: "stay_length",
        label: "Duración estimada de la estadía",
        type: "NUMBER",
        required: true,
        config: { min: 1, max: 999 },
        help: { guidance: "Cantidad de días, semanas o meses (elija la unidad en la siguiente pregunta).", example: "15" },
      },
      {
        key: "stay_unit",
        label: "Unidad de tiempo",
        type: "SELECT",
        required: true,
        options: opts(["days", "Días"], ["weeks", "Semanas"], ["months", "Meses"], ["years", "Años"]),
        help: { guidance: "Unidad de la duración indicada arriba." },
      },
      {
        key: "us_stay_address",
        label: "Dirección donde se hospedará en EE. UU.",
        type: "TEXTAREA",
        required: true,
        help: {
          guidance: "Dirección del hotel, casa de familiares o lugar donde se quedará: calle, ciudad, estado y código postal.",
          example: "1234 NW 7th St, Miami, FL 33125",
          notApplicable: "Si aún no lo sabe, escriba la ciudad donde planea quedarse y coméntelo a su asesor.",
        },
      },
      {
        key: "payer",
        label: "¿Quién pagará los gastos del viaje?",
        type: "SELECT",
        required: true,
        options: opts(
          ["self", "Yo mismo(a)"],
          ["other_person", "Otra persona"],
          ["employer", "Mi empleador"],
          ["us_employer", "Un empleador en EE. UU."],
          ["organization", "Otra empresa u organización"],
        ),
        help: { guidance: "Indique quién cubrirá la mayor parte de los gastos (pasaje, hospedaje, alimentación)." },
      },
      {
        key: "payer_details",
        label: "Datos de quien pagará el viaje",
        type: "TEXTAREA",
        required: true,
        showIf: { question: "payer", equals: ["other_person", "employer", "us_employer", "organization"] },
        help: {
          guidance: "Nombre completo, relación con usted, dirección, teléfono y correo de la persona u organización.",
          example: "Juan Pérez (hermano), 55 Main St, Boston, MA; +1 617 555 0101; juan@correo.com",
        },
      },
      {
        key: "traveling_with_others",
        label: "¿Viajará acompañado(a)?",
        type: "YESNO",
        required: true,
        help: { guidance: "Responda «Sí» si viajará con familiares, amigos o como parte de un grupo organizado." },
      },
      {
        key: "companions",
        label: "Acompañantes",
        type: "GROUP",
        required: true,
        showIf: yes("traveling_with_others"),
        config: {
          addLabel: "Agregar acompañante",
          maxItems: 10,
          fields: [
            { key: "name", label: "Nombre completo", type: "TEXT", required: true },
            { key: "relationship", label: "Relación", type: "SELECT", required: true, options: RELATIONSHIP },
          ],
        },
        help: {
          guidance: "Agregue a cada persona que viajará con usted.",
          warning: "Si viaja con un grupo organizado (iglesia, empresa, escuela), indíquelo en un acompañante con relación «Otro» y el nombre del grupo.",
        },
      },
    ],
  },

  // ───────────────────────────── 5. Contacto en EE. UU. ─────────────────────────────
  {
    key: "us_contact",
    title: "Contacto en Estados Unidos",
    description: "Una persona u organización en EE. UU. relacionada con su viaje.",
    questions: [
      {
        key: "us_contact_name",
        label: "Nombre de la persona de contacto",
        type: "TEXT",
        help: {
          guidance: "Persona que conoce en EE. UU. y que puede confirmar su visita (familiar, amigo, colega).",
          notApplicable: "Si no conoce a nadie, puede indicar el hotel u organización en la siguiente pregunta.",
        },
      },
      {
        key: "us_contact_org",
        label: "Organización, empresa u hotel",
        type: "TEXT",
        help: { guidance: "Si su contacto es una organización (hotel, empresa, universidad), escriba su nombre.", example: "Hotel Brisas Miami" },
      },
      {
        key: "us_contact_relationship",
        label: "Relación con usted",
        type: "SELECT",
        required: true,
        options: opts(
          ["relative", "Familiar"],
          ["spouse", "Cónyuge / pareja"],
          ["friend", "Amigo(a)"],
          ["business", "Socio(a) de negocios"],
          ["employer", "Empleador"],
          ["school", "Institución educativa"],
          ["hotel", "Hotel / alojamiento"],
          ["other", "Otro"],
        ),
        help: { guidance: "Cómo se relaciona usted con este contacto." },
      },
      {
        key: "us_contact_address",
        label: "Dirección del contacto",
        type: "TEXTAREA",
        required: true,
        help: { guidance: "Calle, ciudad, estado y código postal.", example: "250 Ocean Dr, Miami Beach, FL 33139" },
      },
      { key: "us_contact_phone", label: "Teléfono del contacto", type: "PHONE", required: true, help: { guidance: "Incluya el código de área.", example: "+1 305 555 0199" } },
      { key: "us_contact_email", label: "Correo del contacto", type: "EMAIL", help: { guidance: "Si lo conoce.", notApplicable: "Si no lo sabe, déjelo vacío." } },
    ],
  },

  // ───────────────────────────── 6. Familia ─────────────────────────────
  {
    key: "family",
    title: "Información familiar",
    description: "Datos de sus padres, cónyuge, hijos y familiares en EE. UU.",
    questions: [
      { key: "father_surnames", label: "Apellidos del padre", type: "TEXT", help: { guidance: "Como aparecen en sus documentos.", notApplicable: "Si no conoce esta información, déjela vacía y coméntelo a su asesor." } },
      { key: "father_given_names", label: "Nombres del padre", type: "TEXT", help: { guidance: "Nombres completos de su padre." } },
      { key: "father_birth_date", label: "Fecha de nacimiento del padre", type: "DATE", config: { past: true }, help: { guidance: "Si no conoce la fecha exacta, coméntelo a su asesor." } },
      {
        key: "father_in_us",
        label: "¿Su padre vive en EE. UU.?",
        type: "YESNO",
        required: true,
        help: { guidance: "Responda según su situación actual. Si su padre falleció, responda «No»." },
      },
      { key: "father_us_status", label: "Estatus de su padre en EE. UU.", type: "SELECT", required: true, showIf: yes("father_in_us"), options: US_STATUS, help: { guidance: "Seleccione el estatus migratorio actual de su padre." } },
      { key: "mother_surnames", label: "Apellidos de la madre", type: "TEXT", help: { guidance: "Use los apellidos de soltera si los conoce." } },
      { key: "mother_given_names", label: "Nombres de la madre", type: "TEXT", help: { guidance: "Nombres completos de su madre." } },
      { key: "mother_birth_date", label: "Fecha de nacimiento de la madre", type: "DATE", config: { past: true }, help: { guidance: "Si no conoce la fecha exacta, coméntelo a su asesor." } },
      { key: "mother_in_us", label: "¿Su madre vive en EE. UU.?", type: "YESNO", required: true, help: { guidance: "Responda según su situación actual." } },
      { key: "mother_us_status", label: "Estatus de su madre en EE. UU.", type: "SELECT", required: true, showIf: yes("mother_in_us"), options: US_STATUS, help: { guidance: "Seleccione el estatus migratorio actual de su madre." } },
      {
        key: "spouse_full_name",
        label: "Nombre completo del cónyuge o pareja",
        type: "TEXT",
        required: true,
        showIf: { question: "marital_status", equals: ["married", "common_law", "civil_union", "separated"] },
        help: { guidance: "Nombres y apellidos de su cónyuge o pareja actual.", example: "Carlos Alberto Méndez Soto" },
      },
      {
        key: "spouse_birth_date",
        label: "Fecha de nacimiento del cónyuge",
        type: "DATE",
        required: true,
        config: { past: true },
        showIf: { question: "marital_status", equals: ["married", "common_law", "civil_union", "separated"] },
        help: { guidance: "Fecha de nacimiento de su cónyuge o pareja." },
      },
      {
        key: "spouse_nationality",
        label: "Nacionalidad del cónyuge",
        type: "COUNTRY",
        required: true,
        showIf: { question: "marital_status", equals: ["married", "common_law", "civil_union", "separated"] },
        help: { guidance: "País de nacionalidad de su cónyuge." },
      },
      {
        key: "spouse_birth_place",
        label: "Lugar de nacimiento del cónyuge",
        type: "TEXT",
        showIf: { question: "marital_status", equals: ["married", "common_law", "civil_union", "separated"] },
        help: { guidance: "Ciudad y país.", example: "La Vega, República Dominicana" },
      },
      {
        key: "spouse_address",
        label: "Dirección del cónyuge",
        type: "TEXTAREA",
        showIf: { question: "marital_status", equals: ["married", "common_law", "civil_union", "separated"] },
        help: { guidance: "Si vive con usted, escriba «Misma dirección del solicitante»." },
      },
      {
        key: "former_spouses",
        label: "Matrimonios anteriores",
        type: "GROUP",
        showIf: { question: "marital_status", equals: ["divorced", "widowed", "married", "separated"] },
        config: {
          addLabel: "Agregar matrimonio anterior",
          maxItems: 5,
          fields: [
            { key: "name", label: "Nombre completo", type: "TEXT", required: true },
            { key: "birth_date", label: "Fecha de nacimiento", type: "DATE" },
            { key: "start", label: "Fecha de matrimonio", type: "DATE" },
            { key: "end", label: "Fecha de fin", type: "DATE" },
            { key: "how_ended", label: "Cómo terminó", type: "TEXT", placeholder: "Divorcio, fallecimiento…" },
          ],
        },
        help: {
          guidance: "Si estuvo casado(a) antes, agregue cada matrimonio anterior.",
          notApplicable: "Si no tuvo matrimonios anteriores, deje la lista vacía.",
        },
      },
      { key: "has_children", label: "¿Tiene hijos?", type: "YESNO", required: true, help: { guidance: "Incluya hijos de cualquier edad." } },
      {
        key: "children",
        label: "Hijos",
        type: "GROUP",
        required: true,
        showIf: yes("has_children"),
        config: {
          addLabel: "Agregar hijo(a)",
          maxItems: 15,
          fields: [
            { key: "name", label: "Nombre completo", type: "TEXT", required: true },
            { key: "birth_date", label: "Fecha de nacimiento", type: "DATE", required: true },
            { key: "residence", label: "País donde vive", type: "COUNTRY" },
          ],
        },
        help: { guidance: "Agregue a cada uno de sus hijos." },
      },
      ...yesNoExplain(
        "relatives_in_us",
        "¿Tiene otros familiares cercanos en EE. UU. (hermanos, hijos, cónyuge)?",
        { guidance: "Familiares inmediatos que vivan en EE. UU., sin contar a sus padres (ya indicados arriba)." },
        "Para cada familiar indique: nombre completo, parentesco y estatus (ciudadano, residente, con visa, otro).",
      ),
    ],
  },

  // ───────────────────────────── 7. Ocupación y educación ─────────────────────────────
  {
    key: "work_education",
    title: "Ocupación, educación y experiencia laboral",
    description: "Su actividad actual, trabajos anteriores y estudios.",
    questions: [
      {
        key: "occupation",
        label: "¿Cuál es su ocupación actual?",
        type: "SELECT",
        required: true,
        options: opts(
          ["employed", "Empleado(a)"],
          ["self_employed", "Negocio propio / independiente"],
          ["student", "Estudiante"],
          ["homemaker", "Ama(o) de casa"],
          ["retired", "Jubilado(a) / pensionado(a)"],
          ["unemployed", "Sin empleo actualmente"],
          ["other", "Otra"],
        ),
        help: {
          guidance: "Indique a qué se dedica actualmente. Puede tratarse de un empleo formal, negocio propio, actividad independiente, estudios, jubilación u otra situación.",
          example: "Docente de educación secundaria → Empleado(a).",
        },
      },
      {
        key: "occupation_explain",
        label: "Describa su situación actual",
        type: "TEXTAREA",
        required: true,
        showIf: { question: "occupation", equals: ["unemployed", "other"] },
        help: { guidance: "Explique brevemente su situación y cómo se sostiene económicamente." },
      },
      {
        key: "employer_name",
        label: "Nombre del empleador, negocio o institución",
        type: "TEXT",
        required: true,
        showIf: { question: "occupation", equals: ["employed", "self_employed", "student"] },
        help: { guidance: "Empresa donde trabaja, nombre de su negocio o institución donde estudia.", example: "Colegio San Juan Bautista" },
      },
      {
        key: "employer_address",
        label: "Dirección del trabajo o institución",
        type: "TEXTAREA",
        required: true,
        showIf: { question: "occupation", equals: ["employed", "self_employed", "student"] },
        help: { guidance: "Calle, ciudad, provincia y país." },
      },
      {
        key: "employer_phone",
        label: "Teléfono del trabajo o institución",
        type: "PHONE",
        required: true,
        showIf: { question: "occupation", equals: ["employed", "self_employed", "student"] },
        help: { guidance: "Número principal de la empresa o institución." },
      },
      {
        key: "job_title",
        label: "Cargo o puesto",
        type: "TEXT",
        required: true,
        showIf: { question: "occupation", equals: ["employed", "self_employed"] },
        help: { guidance: "Nombre de su puesto.", example: "Profesora de Matemáticas" },
      },
      {
        key: "job_start",
        label: "Fecha de inicio en este trabajo",
        type: "DATE",
        required: true,
        config: { past: true },
        showIf: { question: "occupation", equals: ["employed", "self_employed"] },
        help: { guidance: "Si no recuerda el día exacto, use el primer día del mes." },
      },
      {
        key: "monthly_income",
        label: "Ingreso mensual aproximado (moneda local)",
        type: "NUMBER",
        showIf: { question: "occupation", equals: ["employed", "self_employed"] },
        config: { min: 0 },
        help: {
          guidance: "Ingreso mensual aproximado, en la moneda de su país. Solo números.",
          example: "45000",
          warning: "Debe coincidir con lo que pueda demostrar con documentos (carta de trabajo, estados de cuenta).",
        },
      },
      {
        key: "job_duties",
        label: "Describa brevemente sus funciones",
        type: "TEXTAREA",
        required: true,
        showIf: { question: "occupation", equals: ["employed", "self_employed"] },
        help: { guidance: "En una o dos frases, explique qué hace en su trabajo.", example: "Imparto clases de matemáticas a estudiantes de 4.º a 6.º de secundaria." },
      },
      {
        key: "previously_employed",
        label: "¿Ha tenido empleos anteriores en los últimos cinco años?",
        type: "YESNO",
        required: true,
        help: { guidance: "Sin contar su empleo actual." },
      },
      {
        key: "previous_jobs",
        label: "Empleos anteriores",
        type: "GROUP",
        required: true,
        showIf: yes("previously_employed"),
        config: {
          addLabel: "Agregar empleo anterior",
          maxItems: 8,
          fields: [
            { key: "employer", label: "Empleador", type: "TEXT", required: true },
            { key: "title", label: "Cargo", type: "TEXT", required: true },
            { key: "address", label: "Dirección", type: "TEXT" },
            { key: "phone", label: "Teléfono", type: "PHONE" },
            { key: "supervisor", label: "Supervisor", type: "TEXT" },
            ...DATE_FIELDS(),
          ],
        },
        help: { guidance: "Agregue cada empleo, empezando por el más reciente." },
      },
      {
        key: "has_higher_education",
        label: "¿Ha cursado estudios de secundaria o superiores?",
        type: "YESNO",
        required: true,
        help: { guidance: "Incluya bachillerato, estudios técnicos, universidad y posgrados." },
      },
      {
        key: "education",
        label: "Estudios realizados",
        type: "GROUP",
        required: true,
        showIf: yes("has_higher_education"),
        config: {
          addLabel: "Agregar institución",
          maxItems: 8,
          fields: [
            { key: "institution", label: "Institución", type: "TEXT", required: true },
            { key: "program", label: "Carrera o programa", type: "TEXT" },
            { key: "city", label: "Ciudad y país", type: "TEXT" },
            ...DATE_FIELDS(),
          ],
        },
        help: { guidance: "Agregue cada institución donde estudió.", example: "Universidad Autónoma de Santo Domingo – Licenciatura en Educación" },
      },
    ],
  },

  // ───────────────────────────── 8. Viajes y visas anteriores ─────────────────────────────
  {
    key: "us_history",
    title: "Viajes y visas anteriores",
    description: "Sus viajes previos a EE. UU. y solicitudes de visa anteriores.",
    questions: [
      { key: "been_to_us", label: "¿Ha estado alguna vez en EE. UU.?", type: "YESNO", required: true, help: { guidance: "Incluya cualquier visita, aunque haya sido breve o hace muchos años." } },
      {
        key: "us_visits",
        label: "Visitas anteriores a EE. UU.",
        type: "GROUP",
        required: true,
        showIf: yes("been_to_us"),
        config: {
          addLabel: "Agregar visita",
          maxItems: 5,
          fields: [
            { key: "arrival", label: "Fecha de llegada", type: "DATE", required: true },
            { key: "length", label: "Duración (ej. 15 días)", type: "TEXT", required: true },
          ],
        },
        help: { guidance: "Agregue las visitas más recientes (hasta cinco).", warning: "Si alguna vez se quedó más tiempo del permitido, coméntelo a su asesor." },
      },
      {
        key: "had_us_visa",
        label: "¿Le han otorgado alguna vez una visa de EE. UU.?",
        type: "YESNO",
        required: true,
        help: { guidance: "Responda «Sí» aunque la visa ya esté vencida." },
      },
      { key: "last_visa_date", label: "Fecha de emisión de la última visa", type: "DATE", required: true, config: { past: true }, showIf: yes("had_us_visa"), help: { guidance: "Aparece en la visa (fecha de emisión)." } },
      {
        key: "last_visa_number",
        label: "Número de la última visa",
        type: "TEXT",
        sensitive: true,
        showIf: yes("had_us_visa"),
        help: { guidance: "Número impreso en la visa (usualmente en rojo).", notApplicable: "Si no lo tiene a mano, déjelo vacío y coméntelo a su asesor." },
      },
      {
        key: "last_visa_lost",
        label: "¿Esa visa fue perdida, robada, cancelada o revocada?",
        type: "YESNO",
        required: true,
        showIf: yes("had_us_visa"),
        help: { guidance: "Responda «Sí» si ocurrió cualquiera de estas situaciones." },
      },
      ...yesNoExplain(
        "visa_refused",
        "¿Le han negado alguna vez una visa o la entrada a EE. UU.?",
        {
          guidance: "Incluya negaciones de visa en el consulado y casos en que no le permitieron entrar en un aeropuerto o frontera.",
          warning: "Responda con exactitud: el historial de solicitudes anteriores queda registrado.",
        },
        "Indique fechas aproximadas, tipo de visa solicitada y el motivo que le informaron.",
      ),
      ...yesNoExplain(
        "immigrant_petition",
        "¿Alguien ha presentado una petición de inmigrante a su favor?",
        { guidance: "Por ejemplo, si un familiar o empleador presentó una petición para que usted obtenga la residencia." },
        "Indique quién presentó la petición, cuándo y su estado actual (si lo conoce).",
      ),
      {
        key: "other_countries_visited",
        label: "Países visitados en los últimos cinco años",
        type: "TEXTAREA",
        help: {
          guidance: "Escriba los países que ha visitado, separados por comas.",
          example: "Panamá, España, Colombia",
          notApplicable: "Si no ha viajado fuera de su país, escriba «Ninguno».",
        },
      },
    ],
  },

  // ───────────────────────────── 9. Información adicional ─────────────────────────────
  {
    key: "additional",
    title: "Información adicional",
    description: "Idiomas, organizaciones, servicio militar y otros antecedentes.",
    questions: [
      { key: "languages", label: "Idiomas que habla", type: "TEXT", required: true, help: { guidance: "Todos los idiomas que habla, separados por comas.", example: "Español, inglés básico" } },
      ...yesNoExplain(
        "organizations",
        "¿Pertenece o ha pertenecido a organizaciones profesionales, sociales o benéficas?",
        { guidance: "Incluya asociaciones profesionales, clubes, organizaciones religiosas o comunitarias, sindicatos." },
        "Escriba el nombre de cada organización y su papel en ella.",
      ),
      ...yesNoExplain(
        "military_service",
        "¿Ha prestado servicio militar?",
        { guidance: "Incluya servicio obligatorio o voluntario en fuerzas armadas o policiales militares." },
        "País, rama, rango, especialidad y fechas de servicio.",
      ),
      ...yesNoExplain(
        "special_skills",
        "¿Tiene conocimientos especializados en armas de fuego, explosivos, o materiales nucleares, biológicos o químicos?",
        {
          guidance: "Se refiere a formación técnica o experiencia profesional en esas áreas.",
          notApplicable: "La mayoría de las personas responde «No».",
        },
      ),
      ...yesNoExplain(
        "clan_tribe",
        "¿Pertenece a un clan o tribu?",
        { guidance: "Aplica en algunas culturas donde la pertenencia a un clan o tribu es parte de la identidad.", notApplicable: "La mayoría de los solicitantes de la región responde «No»." },
        "Nombre del clan o tribu.",
      ),
      {
        key: "notes_for_advisor",
        label: "¿Hay algo más que su asesor deba saber?",
        type: "TEXTAREA",
        config: { maxLength: 2000 },
        help: {
          guidance: "Use este espacio para cualquier aclaración o situación especial que no encaje en otras preguntas.",
          example: "Tengo un viaje previsto a Canadá antes de la cita y quiero saber si afecta algo.",
        },
      },
    ],
  },

  // ───────────────────────────── 10. Seguridad y elegibilidad ─────────────────────────────
  {
    key: "security",
    title: "Antecedentes y elegibilidad",
    description: "Preguntas generales sobre salud, antecedentes y situación migratoria.",
    notice:
      "Estas preguntas resumen, en lenguaje sencillo, los temas de antecedentes que aborda el proceso oficial. No son la redacción oficial: su asesor las revisará con usted antes de completar la solicitud. Responda con honestidad; si responde «Sí», explique.",
    questions: [
      ...yesNoExplain("sec_health", "¿Tiene alguna enfermedad transmisible de importancia para la salud pública, o algún trastorno físico o mental que pueda representar un riesgo para usted u otras personas?", {
        guidance: "Se refiere a enfermedades contagiosas graves (por ejemplo, tuberculosis activa) o condiciones que hayan causado conductas peligrosas.",
        notApplicable: "Condiciones comunes controladas (presión alta, diabetes) normalmente no aplican. Si tiene dudas, consulte a su asesor.",
      }),
      ...yesNoExplain("sec_drugs", "¿Consume o ha consumido drogas ilegales, o tiene un problema de abuso de sustancias?", {
        guidance: "Incluye consumo de drogas ilegales en cualquier país, aunque haya ocurrido hace tiempo.",
      }),
      ...yesNoExplain("sec_arrests", "¿Ha sido arrestado(a), acusado(a) o condenado(a) alguna vez por un delito, aunque haya sido perdonado o el caso se haya cerrado?", {
        guidance: "Incluya cualquier detención o proceso penal, en cualquier país.",
        warning: "Aunque el caso se haya archivado o anulado, debe informarlo a su asesor.",
      }),
      ...yesNoExplain("sec_controlled_substances", "¿Ha violado alguna ley sobre sustancias controladas o ha participado en su tráfico?", {
        guidance: "Incluye venta, transporte o ayuda en el tráfico de drogas.",
      }),
      ...yesNoExplain("sec_trafficking", "¿Ha participado en prostitución, trata de personas o lavado de dinero?", {
        guidance: "Incluye haber facilitado o beneficiado de esas actividades.",
      }),
      ...yesNoExplain("sec_security", "¿Ha participado o pretende participar en espionaje, sabotaje, terrorismo u otras actividades que amenacen la seguridad?", {
        guidance: "Incluye apoyo, financiamiento o pertenencia a grupos que realicen esas actividades.",
      }),
      ...yesNoExplain("sec_human_rights", "¿Ha participado en genocidio, tortura, ejecuciones extrajudiciales, reclutamiento de niños soldados u otras violaciones graves de derechos humanos?", {
        guidance: "Incluye haber ordenado, ayudado o participado de cualquier forma.",
      }),
      ...yesNoExplain("sec_immigration_fraud", "¿Ha intentado obtener una visa, la entrada a EE. UU. u otro beneficio migratorio con documentos o información falsa?", {
        guidance: "Incluye haber presentado documentos alterados o datos falsos en solicitudes anteriores.",
      }),
      ...yesNoExplain("sec_removal", "¿Ha sido deportado(a), removido(a) o se le ha ordenado salir de EE. UU.?", {
        guidance: "Incluye salidas voluntarias ordenadas por un juez u oficial migratorio.",
      }),
      ...yesNoExplain("sec_overstay", "¿Ha permanecido en EE. UU. más tiempo del autorizado o violado las condiciones de una visa?", {
        guidance: "Por ejemplo, quedarse después de la fecha permitida o trabajar sin autorización con una visa de turista.",
      }),
      ...yesNoExplain("sec_child_custody", "¿Ha retenido fuera de EE. UU. a un menor ciudadano estadounidense en contra de una orden de custodia?", {
        guidance: "Aplica solo a situaciones de custodia de menores con decisiones judiciales en EE. UU.",
        notApplicable: "La mayoría de los solicitantes responde «No».",
      }),
      ...yesNoExplain("sec_other", "¿Ha votado en EE. UU. sin ser ciudadano(a) o renunciado a la ciudadanía estadounidense para evitar impuestos?", {
        guidance: "Aplica a casos muy específicos.",
        notApplicable: "La mayoría de los solicitantes responde «No».",
      }),
    ],
  },
];

export const SECURITY_QUESTIONS = [
  "¿Cuál es el nombre de su primera mascota?",
  "¿En qué ciudad se conocieron sus padres?",
  "¿Cuál es el nombre de su escuela primaria?",
  "¿Cuál es el segundo nombre de su abuela materna?",
  "¿Cuál fue su primer trabajo?",
  "¿Cuál es el nombre de la calle donde vivía de niño(a)?",
];

export const DEFAULT_PRIVACY_POLICY = `## Política de privacidad

**Responsable.** Esta plataforma es un servicio privado de preparación y asesoría. No pertenece al Gobierno de los Estados Unidos ni está afiliada al Departamento de Estado.

**Qué información recopilamos.** Los datos que usted ingresa en el formulario de preparación (identidad, contacto, pasaporte, viaje, familia, empleo, antecedentes), los mensajes que intercambia con su asesor y registros técnicos de actividad (fechas de acceso y acciones realizadas).

**Copia de su documento.** Para que su asesor compruebe que los datos coinciden con su pasaporte, se le pide una foto de la página de datos (y, opcionalmente, de su cédula). La imagen se guarda cifrada en un almacenamiento privado, solo la pueden ver usted y su asesor, cada consulta queda registrada y se elimina automáticamente después de la revisión, según el plazo configurado.

**Para qué la usamos.** Exclusivamente para revisar su información, orientarle y preparar su solicitud. No vendemos ni compartimos sus datos con terceros con fines comerciales.

**Quién puede acceder.** Usted, mediante su código de expediente y sus datos de verificación, y el personal asesor autorizado.

**Cómo la protegemos.** Conexiones cifradas (HTTPS), cifrado de las respuestas almacenadas, respuestas de seguridad guardadas como hash, control de acceso y registro de auditoría. Ningún sistema es completamente invulnerable, pero aplicamos medidas razonables para reducir riesgos.

**Cuánto tiempo la conservamos.** Mientras dure la asesoría y el tiempo razonable posterior para atender consultas, salvo que usted solicite su eliminación antes.

**Sus derechos.** Puede solicitar la corrección o eliminación de sus datos comunicándose con su asesor por los canales de contacto indicados en la plataforma.

**Credenciales oficiales.** Nunca le pediremos contraseñas de portales gubernamentales.`;
