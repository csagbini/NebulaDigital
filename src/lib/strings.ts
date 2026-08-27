/**
 * ============================================================================
 * NEBULA DIGITAL — CLIENT INTAKE: ALL COPY LIVES HERE
 * ============================================================================
 *
 * Felu — this is the only file you need to touch to change wording.
 *
 *   - Edit any `en:` or `es:` string freely. Save, redeploy, done.
 *   - Do NOT change a `key:` or an option `value:` unless you mean it.
 *     Those identify answers in the notification email.
 *   - To add a question: add a field to a section below. The form, the
 *     server-side validation, and the notification email all pick it up
 *     automatically — you don't touch any component.
 *
 * ============================================================================
 */

export type Lang = "en" | "es";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "url"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select";

export interface Option {
  value: string; // sent in the notification email — treat as permanent
  en: string;
  es: string;
}

export interface Field {
  key: string; // field id in the notification email — treat as permanent
  type: FieldType;
  required?: boolean;
  label: { en: string; es: string };
  help?: { en: string; es: string };
  placeholder?: { en: string; es: string };
  options?: Option[];
  /** Only show this field when another field has a given value. */
  showIf?: { key: string; equals?: string; includes?: string };
  maxLength?: number;
}

export interface Section {
  id: string;
  title: { en: string; es: string };
  subtitle: { en: string; es: string };
  fields: Field[];
}

/* ==========================================================================
 * INTERFACE COPY (buttons, errors, thank-you screen)
 * ========================================================================== */

/** Every key here must exist in both languages — TypeScript enforces it. */
export interface UiStrings {
  brandAlt: string;
  kicker: string;
  introTitle: string;
  introBody: string;
  submit: string;
  submitting: string;
  optional: string;
  required: string;
  selectAll: string;
  errRequired: string;
  errEmail: string;
  errUrl: string;
  errPhone: string;
  errTooLong: string;
  errPickOne: string;
  errFixAbove: string;
  errSubmit: string;
  errRateLimit: string;
  thanksTitle: string;
  thanksBody: string;
  thanksBack: string;
  restored: string;
  restartLink: string;
}

export const ui: Record<Lang, UiStrings> = {
  en: {
    brandAlt: "Nebula Digital",
    kicker: "Client intake",
    introTitle: "Tell us about your business.",
    introBody:
      "A few questions so we can scope your project. Your answers save as you go, so you can close this and come back later.",
    submit: "Submit",
    submitting: "Sending…",
    optional: "Optional",
    required: "Required",
    selectAll: "Select all that apply",
    errRequired: "This one's required.",
    errEmail: "That doesn't look like a valid email address.",
    errUrl: "That doesn't look like a valid web address.",
    errPhone: "That doesn't look like a valid phone number.",
    errTooLong: "That's a bit too long.",
    errPickOne: "Pick at least one.",
    errFixAbove: "Please fix the highlighted answers before submitting.",
    errSubmit:
      "Something went wrong sending this. Your answers are still saved — please try again.",
    errRateLimit:
      "That's a few too many submissions from this connection. Please try again in a little while.",
    thanksTitle: "Thank you.",
    thanksBody: "We'll get back to you soon.",
    thanksBack: "Back to nebuladigital.io",
    restored: "We restored your answers from last time.",
    restartLink: "Start over",
  },
  es: {
    brandAlt: "Nebula Digital",
    kicker: "Formulario de cliente",
    introTitle: "Cuéntanos sobre tu negocio.",
    introBody:
      "Unas preguntas para definir tu proyecto. Tus respuestas se guardan solas, así que puedes cerrar esto y volver después.",
    submit: "Enviar",
    submitting: "Enviando…",
    optional: "Opcional",
    required: "Obligatorio",
    selectAll: "Selecciona todas las que apliquen",
    errRequired: "Esta es obligatoria.",
    errEmail: "Ese correo no parece válido.",
    errUrl: "Esa dirección web no parece válida.",
    errPhone: "Ese teléfono no parece válido.",
    errTooLong: "Eso es un poco largo.",
    errPickOne: "Elige al menos una.",
    errFixAbove: "Corrige las respuestas marcadas para enviar.",
    errSubmit:
      "Algo salió mal al enviar. Tus respuestas siguen guardadas — inténtalo de nuevo.",
    errRateLimit:
      "Demasiados envíos desde esta conexión. Inténtalo de nuevo en un rato.",
    thanksTitle: "Gracias.",
    thanksBody: "Te contactaremos pronto.",
    thanksBack: "Volver a nebuladigital.io",
    restored: "Restauramos tus respuestas anteriores.",
    restartLink: "Empezar de nuevo",
  },
};

/* ==========================================================================
 * THE QUESTIONS
 * ========================================================================== */

export const sections: Section[] = [
  {
    id: "intake",
    title: { en: "Project intake", es: "Formulario del proyecto" },
    subtitle: {
      en: "What we need to get started.",
      es: "Lo que necesitamos para empezar.",
    },
    fields: [
      {
        key: "contact_name",
        type: "text",
        required: true,
        maxLength: 120,
        label: { en: "Your name", es: "Tu nombre" },
      },
      {
        key: "business_name",
        type: "text",
        required: true,
        maxLength: 160,
        label: { en: "Business name", es: "Nombre del negocio" },
      },
      {
        key: "email",
        type: "email",
        required: true,
        maxLength: 200,
        label: { en: "Email address", es: "Correo electrónico" },
      },
      {
        key: "phone",
        type: "tel",
        required: true,
        maxLength: 40,
        label: { en: "Phone number", es: "Teléfono" },
      },
      {
        key: "business_description",
        type: "textarea",
        required: true,
        maxLength: 600,
        label: {
          en: "What does your business do?",
          es: "¿A qué se dedica tu negocio?",
        },
        help: {
          en: "One or two sentences — imagine explaining it to a new customer.",
          es: "Una o dos frases — como si se lo explicaras a un cliente nuevo.",
        },
      },
      {
        key: "website_url",
        type: "url",
        maxLength: 300,
        label: {
          en: "Website URL, if you have one",
          es: "URL del sitio web, si tienes uno",
        },
        placeholder: { en: "yourbusiness.com", es: "tunegocio.com" },
      },
      {
        key: "services_wanted",
        type: "checkbox",
        required: true,
        label: {
          en: "What do you want help with?",
          es: "¿En qué quieres que te ayudemos?",
        },
        options: [
          { value: "new_website", en: "New website", es: "Sitio web nuevo" },
          {
            value: "improve_site",
            en: "Fix or improve my current site",
            es: "Arreglar o mejorar mi sitio actual",
          },
          {
            value: "ads",
            en: "Ads (Meta / Google)",
            es: "Anuncios (Meta / Google)",
          },
          { value: "local_seo", en: "Local SEO", es: "SEO local" },
          {
            value: "ai_automation",
            en: "AI / automation",
            es: "IA / automatización",
          },
          { value: "custom_app", en: "Custom app", es: "App a medida" },
        ],
      },
      {
        key: "budget_range",
        type: "radio",
        required: true,
        label: {
          en: "What budget range are you working with?",
          es: "¿Con qué rango de presupuesto trabajas?",
        },
        help: {
          en: "This isn't a commitment — it tells us what's realistic to propose.",
          es: "No es un compromiso — nos dice qué es realista proponer.",
        },
        options: [
          { value: "under_2500", en: "Under $2,500", es: "Menos de $2,500" },
          { value: "2500_5000", en: "$2,500–$5,000", es: "$2,500–$5,000" },
          { value: "5000_10000", en: "$5,000–$10,000", es: "$5,000–$10,000" },
          { value: "10000_25000", en: "$10,000–$25,000", es: "$10,000–$25,000" },
          { value: "over_25000", en: "$25,000+", es: "Más de $25,000" },
          {
            value: "unsure",
            en: "Not sure yet — advise me",
            es: "Aún no sé — oriéntame",
          },
        ],
      },
      {
        key: "timeline",
        type: "radio",
        required: true,
        label: { en: "When do you want to launch?", es: "¿Cuándo quieres lanzar?" },
        options: [
          { value: "asap", en: "As soon as possible", es: "Lo antes posible" },
          { value: "1_month", en: "Within 1 month", es: "En 1 mes" },
          { value: "1_3_months", en: "1–3 months", es: "1–3 meses" },
          { value: "3_6_months", en: "3–6 months", es: "3–6 meses" },
          { value: "no_date", en: "No fixed date", es: "Sin fecha fija" },
        ],
      },
      {
        key: "contact_preference",
        type: "radio",
        required: true,
        label: {
          en: "Best way to reach you?",
          es: "¿Cuál es la mejor forma de contactarte?",
        },
        options: [
          { value: "email", en: "Email", es: "Correo" },
          { value: "phone", en: "Phone call", es: "Llamada" },
          { value: "text", en: "Text or WhatsApp", es: "Mensaje o WhatsApp" },
          { value: "video", en: "Video call", es: "Videollamada" },
        ],
      },
      {
        key: "notes",
        type: "textarea",
        maxLength: 2000,
        label: {
          en: "Anything else we should know? Paste links here too.",
          es: "¿Algo más que debamos saber? También puedes pegar enlaces.",
        },
        help: {
          en: "Optional. Logos, photos, a current site, examples — Google Drive, Dropbox, or any URL. You can also attach files when you reply to our follow-up.",
          es: "Opcional. Logos, fotos, el sitio actual, ejemplos — Google Drive, Dropbox o cualquier URL. También puedes adjuntar archivos cuando respondas nuestro correo.",
        },
      },
    ],
  },
];

/* ==========================================================================
 * DERIVED HELPERS — used by the form, the API and the notification email
 * ========================================================================== */

/** Every field across every section, flattened. */
export const allFields: Field[] = sections.flatMap((s) => s.fields);

export function fieldByKey(key: string): Field | undefined {
  return allFields.find((f) => f.key === key);
}

export function optionLabel(field: Field, value: string, lang: Lang): string {
  const opt = field.options?.find((o) => o.value === value);
  return opt ? opt[lang] : value;
}
