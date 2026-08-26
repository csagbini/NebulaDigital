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
  introStart: string;
  introMeta: string;
  step: string;
  of: string;
  back: string;
  next: string;
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
      "About 5 minutes. Your answers save automatically, so you can close this and come back to it later.",
    introStart: "Begin",
    introMeta: "6 sections · ~5 minutes · Your progress is saved",
    step: "Step",
    of: "of",
    back: "Back",
    next: "Continue",
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
    errFixAbove: "Please fix the highlighted answers before continuing.",
    errSubmit:
      "Something went wrong sending this. Your answers are still saved — please try again.",
    errRateLimit:
      "That's a few too many submissions from this connection. Please try again in a little while.",
    thanksTitle: "Thank you.",
    thanksBody:
      "We've got everything we need. We'll review your answers and follow up within **2 business days** with next steps.",
    thanksBack: "Back to nebuladigital.io",
    restored: "We restored your answers from last time.",
    restartLink: "Start over",
  },
  es: {
    brandAlt: "Nebula Digital",
    kicker: "Formulario de cliente",
    introTitle: "Cuéntanos sobre tu negocio.",
    introBody:
      "Unos 5 minutos. Tus respuestas se guardan solas, así que puedes cerrar esto y volver después.",
    introStart: "Empezar",
    introMeta: "6 secciones · ~5 minutos · Tu progreso se guarda",
    step: "Paso",
    of: "de",
    back: "Atrás",
    next: "Continuar",
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
    errFixAbove: "Corrige las respuestas marcadas para continuar.",
    errSubmit:
      "Algo salió mal al enviar. Tus respuestas siguen guardadas — inténtalo de nuevo.",
    errRateLimit:
      "Demasiados envíos desde esta conexión. Inténtalo de nuevo en un rato.",
    thanksTitle: "Gracias.",
    thanksBody:
      "Ya tenemos todo lo que necesitamos. Revisaremos tus respuestas y te contactaremos en un plazo de **2 días hábiles** con los siguientes pasos.",
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
    id: "business",
    title: { en: "About your business", es: "Sobre tu negocio" },
    subtitle: {
      en: "Let's start with the basics.",
      es: "Empecemos por lo básico.",
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
        maxLength: 1200,
        label: {
          en: "What does your business do?",
          es: "¿A qué se dedica tu negocio?",
        },
        help: {
          en: "In a sentence or two — imagine explaining it to a new customer.",
          es: "En una o dos frases — como si se lo explicaras a un cliente nuevo.",
        },
      },
      {
        key: "years_in_business",
        type: "select",
        required: true,
        label: {
          en: "How long have you been in business?",
          es: "¿Cuánto tiempo llevas en el negocio?",
        },
        options: [
          { value: "starting", en: "Just starting out", es: "Apenas empezando" },
          { value: "under_1", en: "Less than 1 year", es: "Menos de 1 año" },
          { value: "1_3", en: "1–3 years", es: "1–3 años" },
          { value: "3_10", en: "3–10 years", es: "3–10 años" },
          { value: "over_10", en: "More than 10 years", es: "Más de 10 años" },
        ],
      },
      {
        key: "customer_location",
        type: "textarea",
        required: true,
        maxLength: 600,
        label: {
          en: "Where are your customers located?",
          es: "¿Dónde están tus clientes?",
        },
        help: {
          en: "City, region, nationwide, or online-only.",
          es: "Ciudad, región, todo el país, o solo en línea.",
        },
      },
      {
        key: "typical_customer",
        type: "textarea",
        required: true,
        maxLength: 1200,
        label: {
          en: "Describe your typical customer.",
          es: "Describe a tu cliente típico.",
        },
      },
      {
        key: "differentiator",
        type: "textarea",
        required: true,
        maxLength: 1200,
        label: {
          en: "What makes you different from your competitors?",
          es: "¿Qué te hace diferente de tu competencia?",
        },
      },
      {
        key: "has_website",
        type: "radio",
        required: true,
        label: {
          en: "Do you have a website today?",
          es: "¿Tienes un sitio web actualmente?",
        },
        options: [
          { value: "yes", en: "Yes", es: "Sí" },
          { value: "no", en: "No", es: "No" },
        ],
      },
      {
        key: "website_url",
        type: "url",
        required: true,
        maxLength: 300,
        showIf: { key: "has_website", equals: "yes" },
        label: { en: "What's the address?", es: "¿Cuál es la dirección?" },
        placeholder: { en: "yourbusiness.com", es: "tunegocio.com" },
      },
      {
        key: "website_dislikes",
        type: "textarea",
        required: true,
        maxLength: 1500,
        showIf: { key: "has_website", equals: "yes" },
        label: {
          en: "What don't you like about it?",
          es: "¿Qué no te gusta de él?",
        },
        help: {
          en: "Be blunt — this is the most useful answer on the form.",
          es: "Sé directo — esta es la respuesta más útil de todo el formulario.",
        },
      },
    ],
  },

  {
    id: "goals",
    title: { en: "What success looks like", es: "Cómo se ve el éxito" },
    subtitle: {
      en: "This shapes every decision we make.",
      es: "Esto define cada decisión que tomamos.",
    },
    fields: [
      {
        key: "primary_goal",
        type: "radio",
        required: true,
        label: {
          en: "What's the main thing you want this site to do?",
          es: "¿Qué es lo principal que quieres que haga este sitio?",
        },
        help: {
          en: "Pick one. If everything is a priority, nothing is.",
          es: "Elige una. Si todo es prioridad, nada lo es.",
        },
        options: [
          { value: "calls", en: "Get phone calls", es: "Recibir llamadas" },
          {
            value: "forms",
            en: "Get form submissions",
            es: "Recibir mensajes por formulario",
          },
          { value: "sales", en: "Sell online", es: "Vender en línea" },
          {
            value: "bookings",
            en: "Take bookings or appointments",
            es: "Recibir reservas o citas",
          },
          {
            value: "credibility",
            en: "Build credibility",
            es: "Dar credibilidad",
          },
          { value: "other", en: "Something else", es: "Otra cosa" },
        ],
      },
      {
        key: "primary_goal_other",
        type: "text",
        maxLength: 300,
        showIf: { key: "primary_goal", equals: "other" },
        label: { en: "Tell us more", es: "Cuéntanos más" },
      },
      {
        key: "success_metric",
        type: "textarea",
        required: true,
        maxLength: 1200,
        label: {
          en: "Six months after launch, how will you know this worked?",
          es: "Seis meses después del lanzamiento, ¿cómo sabrás que funcionó?",
        },
        help: {
          en: 'A number is ideal — "10 new inquiries a month" beats "more traffic."',
          es: 'Un número es lo ideal — "10 consultas nuevas al mes" es mejor que "más tráfico".',
        },
      },
      {
        key: "sites_liked",
        type: "textarea",
        required: true,
        maxLength: 1500,
        label: {
          en: "Show us 2–3 sites you like — and say why.",
          es: "Muéstranos 2–3 sitios que te gusten — y dinos por qué.",
        },
        help: {
          en: "They don't have to be in your industry. The why matters more than the link.",
          es: "No tienen que ser de tu industria. El porqué importa más que el enlace.",
        },
      },
      {
        key: "sites_disliked",
        type: "textarea",
        maxLength: 1500,
        label: {
          en: "Any sites you dislike? What put you off?",
          es: "¿Algún sitio que no te guste? ¿Qué te desagradó?",
        },
      },
    ],
  },

  {
    id: "content",
    title: { en: "Content & assets", es: "Contenido y materiales" },
    subtitle: {
      en: "What you already have, and what we'll create.",
      es: "Lo que ya tienes y lo que crearemos.",
    },
    fields: [
      {
        key: "pages_needed",
        type: "checkbox",
        required: true,
        label: { en: "Which pages do you need?", es: "¿Qué páginas necesitas?" },
        options: [
          { value: "home", en: "Home", es: "Inicio" },
          { value: "about", en: "About", es: "Nosotros" },
          { value: "services", en: "Services", es: "Servicios" },
          {
            value: "service_detail",
            en: "Individual service pages",
            es: "Páginas por servicio",
          },
          { value: "pricing", en: "Pricing", es: "Precios" },
          {
            value: "portfolio",
            en: "Portfolio or gallery",
            es: "Portafolio o galería",
          },
          { value: "case_studies", en: "Case studies", es: "Casos de éxito" },
          { value: "testimonials", en: "Testimonials", es: "Testimonios" },
          { value: "blog", en: "Blog", es: "Blog" },
          { value: "faq", en: "FAQ", es: "Preguntas frecuentes" },
          { value: "contact", en: "Contact", es: "Contacto" },
          { value: "careers", en: "Careers", es: "Empleo" },
          { value: "locations", en: "Locations", es: "Ubicaciones" },
          { value: "booking", en: "Booking", es: "Reservas" },
          { value: "shop", en: "Shop", es: "Tienda" },
          { value: "client_login", en: "Client login", es: "Acceso para clientes" },
        ],
      },
      {
        key: "pages_other",
        type: "text",
        maxLength: 400,
        label: { en: "Anything else?", es: "¿Algo más?" },
      },
      {
        key: "copy_status",
        type: "radio",
        required: true,
        label: {
          en: "Do you have the written content?",
          es: "¿Tienes los textos escritos?",
        },
        options: [
          {
            value: "have_all",
            en: "I have it all written",
            es: "Ya lo tengo todo escrito",
          },
          { value: "have_some", en: "I have some of it", es: "Tengo una parte" },
          {
            value: "need_written",
            en: "I need it written for me",
            es: "Necesito que lo escriban",
          },
        ],
      },
      {
        key: "logo_status",
        type: "radio",
        required: true,
        label: { en: "Logo", es: "Logotipo" },
        options: [
          {
            value: "have_good",
            en: "I have a logo I'm happy with",
            es: "Tengo un logo que me gusta",
          },
          {
            value: "needs_work",
            en: "I have one but it needs work",
            es: "Tengo uno pero necesita mejorar",
          },
          {
            value: "need_design",
            en: "I need one designed",
            es: "Necesito que diseñen uno",
          },
        ],
      },
      {
        key: "photo_status",
        type: "radio",
        required: true,
        label: {
          en: "Do you have professional photos?",
          es: "¿Tienes fotos profesionales?",
        },
        options: [
          { value: "plenty", en: "Yes, plenty", es: "Sí, muchas" },
          { value: "few", en: "A few", es: "Algunas" },
          {
            value: "none",
            en: "No — we'll need stock or a photoshoot",
            es: "No — necesitaremos banco de imágenes o una sesión",
          },
        ],
      },
      {
        key: "site_languages",
        type: "checkbox",
        required: true,
        label: {
          en: "What languages should the site be in?",
          es: "¿En qué idiomas debe estar el sitio?",
        },
        options: [
          { value: "en", en: "English", es: "Inglés" },
          { value: "es", en: "Spanish", es: "Español" },
          { value: "other", en: "Other", es: "Otro" },
        ],
      },
      {
        key: "site_languages_other",
        type: "text",
        maxLength: 200,
        showIf: { key: "site_languages", includes: "other" },
        label: { en: "Which language?", es: "¿Cuál idioma?" },
      },
      {
        key: "brand_guidelines",
        type: "radio",
        label: {
          en: "Do you have brand guidelines, or set colors and fonts?",
          es: "¿Tienes manual de marca, o colores y tipografías definidas?",
        },
        options: [
          { value: "yes", en: "Yes, I'll share them", es: "Sí, los compartiré" },
          {
            value: "informal",
            en: "Some informal preferences",
            es: "Algunas preferencias informales",
          },
          {
            value: "none",
            en: "No — start from scratch",
            es: "No — empezar desde cero",
          },
        ],
      },
    ],
  },

  {
    id: "features",
    title: { en: "Features & integrations", es: "Funciones e integraciones" },
    subtitle: {
      en: "What the site needs to actually do.",
      es: "Lo que el sitio necesita hacer.",
    },
    fields: [
      {
        key: "features_needed",
        type: "checkbox",
        label: {
          en: "Which of these do you need?",
          es: "¿Cuáles de estas necesitas?",
        },
        options: [
          { value: "contact_form", en: "Contact form", es: "Formulario de contacto" },
          {
            value: "booking",
            en: "Online booking or scheduling",
            es: "Reservas o citas en línea",
          },
          { value: "payments", en: "Online payments", es: "Pagos en línea" },
          { value: "store", en: "Online store", es: "Tienda en línea" },
          { value: "blog", en: "Blog or news", es: "Blog o noticias" },
          {
            value: "newsletter",
            en: "Newsletter signup",
            es: "Suscripción a boletín",
          },
          { value: "live_chat", en: "Live chat", es: "Chat en vivo" },
          {
            value: "ai_chatbot",
            en: "AI chatbot or assistant",
            es: "Chatbot o asistente con IA",
          },
          { value: "reviews", en: "Customer reviews", es: "Reseñas de clientes" },
          { value: "map", en: "Map & directions", es: "Mapa y cómo llegar" },
          {
            value: "multi_location",
            en: "Multiple locations",
            es: "Varias ubicaciones",
          },
          {
            value: "quote_calc",
            en: "Quote or price calculator",
            es: "Calculadora de cotización",
          },
          {
            value: "client_portal",
            en: "Client portal or login",
            es: "Portal o acceso para clientes",
          },
          { value: "multi_language", en: "Multi-language", es: "Varios idiomas" },
          { value: "events", en: "Events calendar", es: "Calendario de eventos" },
        ],
      },
      {
        key: "existing_tools",
        type: "textarea",
        maxLength: 1000,
        label: {
          en: "What tools do you already use that the site should connect to?",
          es: "¿Qué herramientas usas ya que el sitio deba conectar?",
        },
        help: {
          en: "CRM, email marketing, booking system, POS, accounting — names are enough.",
          es: "CRM, email marketing, sistema de reservas, punto de venta, contabilidad — con los nombres basta.",
        },
      },
      {
        key: "domain_status",
        type: "radio",
        required: true,
        label: {
          en: "Do you own your domain name?",
          es: "¿Eres dueño de tu dominio?",
        },
        options: [
          {
            value: "own_login",
            en: "Yes, and I have the login",
            es: "Sí, y tengo el acceso",
          },
          {
            value: "own_no_login",
            en: "Yes, but someone else controls it",
            es: "Sí, pero lo controla alguien más",
          },
          { value: "need_one", en: "No — I need one", es: "No — necesito uno" },
        ],
      },
      {
        key: "hosting_status",
        type: "radio",
        label: {
          en: "Who handles hosting today?",
          es: "¿Quién maneja el hosting actualmente?",
        },
        options: [
          { value: "have", en: "I have hosting", es: "Yo tengo hosting" },
          {
            value: "old_dev",
            en: "My old developer or agency does",
            es: "Mi desarrollador o agencia anterior",
          },
          { value: "nobody", en: "Nobody — this is new", es: "Nadie — es nuevo" },
          { value: "unsure", en: "Not sure", es: "No estoy seguro" },
        ],
      },
    ],
  },

  {
    id: "budget",
    title: { en: "Budget & timeline", es: "Presupuesto y tiempos" },
    subtitle: {
      en: "Honest numbers get you an honest proposal.",
      es: "Números honestos dan una propuesta honesta.",
    },
    fields: [
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
        key: "budget_approved",
        type: "radio",
        label: {
          en: "Is that budget already approved?",
          es: "¿Ese presupuesto ya está aprobado?",
        },
        options: [
          { value: "yes", en: "Yes", es: "Sí" },
          { value: "my_call", en: "It's my own decision", es: "Es mi decisión" },
          {
            value: "needs_approval",
            en: "Needs approval from someone else",
            es: "Necesita aprobación de alguien más",
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
        key: "deadline_reason",
        type: "text",
        maxLength: 400,
        label: {
          en: "Is there a hard date driving this?",
          es: "¿Hay una fecha límite que lo impulse?",
        },
        help: {
          en: "An event, a season, a launch, a contract ending.",
          es: "Un evento, una temporada, un lanzamiento, un contrato que termina.",
        },
      },
    ],
  },

  {
    id: "working",
    title: { en: "Working together", es: "Trabajemos juntos" },
    subtitle: {
      en: "Last few — then you're done.",
      es: "Últimas preguntas — y listo.",
    },
    fields: [
      {
        key: "decision_makers",
        type: "radio",
        required: true,
        label: {
          en: "Who signs off on the final design?",
          es: "¿Quién aprueba el diseño final?",
        },
        options: [
          { value: "just_me", en: "Just me", es: "Solo yo" },
          {
            value: "me_plus_one",
            en: "Me and one other person",
            es: "Otra persona y yo",
          },
          { value: "team", en: "A team or committee", es: "Un equipo o comité" },
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
        key: "referral_source",
        type: "select",
        label: {
          en: "How did you hear about Nebula Digital?",
          es: "¿Cómo supiste de Nebula Digital?",
        },
        options: [
          {
            value: "referral",
            en: "Referral from someone",
            es: "Recomendación",
          },
          { value: "google", en: "Google search", es: "Búsqueda en Google" },
          { value: "social", en: "Social media", es: "Redes sociales" },
          { value: "saw_work", en: "Saw your work", es: "Vi su trabajo" },
          { value: "in_person", en: "Met in person", es: "Nos conocimos en persona" },
          { value: "other", en: "Other", es: "Otro" },
        ],
      },
      {
        key: "anything_else",
        type: "textarea",
        maxLength: 2000,
        label: {
          en: "Anything else we should know?",
          es: "¿Algo más que debamos saber?",
        },
      },
      {
        key: "file_links",
        type: "textarea",
        maxLength: 2000,
        label: {
          en: "Links to logos, brand guides, photos, a brief, or examples.",
          es: "Enlaces a logos, manual de marca, fotos, un brief o ejemplos.",
        },
        help: {
          en: "Optional. Paste Google Drive, Dropbox, or website links. You can also attach files when you reply to our follow-up email.",
          es: "Opcional. Pega enlaces de Google Drive, Dropbox o un sitio web. También puedes adjuntar archivos cuando respondas nuestro correo.",
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
