/**
 * Shared validation. The browser and the server both import this file, so a
 * client-side check can never drift from the server-side one. The server does
 * NOT trust the client — it re-runs every rule in here on the raw payload.
 */

import {
  type Field,
  type Lang,
  type Section,
  allFields,
  sections,
  ui,
} from "./strings";

export type Values = Record<string, string | string[]>;
export type Errors = Record<string, string>;

/* -------------------------------------------------------------------------
 * Conditional visibility
 * ---------------------------------------------------------------------- */

/**
 * A field with a `showIf` is only asked when its condition is met. Hidden
 * fields are never required and their values are discarded on submit, so a
 * client can't sneak an answer in for a question that was never shown.
 */
export function isVisible(field: Field, values: Values): boolean {
  if (!field.showIf) return true;
  const target = values[field.showIf.key];

  if (field.showIf.equals !== undefined) {
    return target === field.showIf.equals;
  }
  if (field.showIf.includes !== undefined) {
    return Array.isArray(target) && target.includes(field.showIf.includes);
  }
  return true;
}

export function visibleFields(fields: Field[], values: Values): Field[] {
  return fields.filter((f) => isVisible(f, values));
}

/* -------------------------------------------------------------------------
 * Field rules
 * ---------------------------------------------------------------------- */

// Deliberately permissive. The goal is to catch typos, not to gatekeep valid
// addresses — over-strict email regexes reject more real people than spam.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,25}$/;

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeUrl(raw));
    // Must have a dot in the host — rejects "https://localhost" style typos.
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      u.hostname.includes(".") &&
      !u.hostname.startsWith(".") &&
      !u.hostname.endsWith(".")
    );
  } catch {
    return false;
  }
}

export function validateField(
  field: Field,
  raw: string | string[] | undefined,
  lang: Lang,
): string | null {
  const t = ui[lang];
  const isArray = Array.isArray(raw);
  const str = isArray ? "" : (raw ?? "").toString().trim();
  const arr = isArray ? (raw as string[]) : [];

  // --- required ---
  if (field.required) {
    if (field.type === "checkbox") {
      if (arr.length === 0) return t.errPickOne;
    } else if (!str) {
      return t.errRequired;
    }
  }

  // Everything below only applies to non-empty answers.
  if (field.type !== "checkbox" && !str) return null;

  // --- length ---
  if (field.maxLength && str.length > field.maxLength) return t.errTooLong;

  // --- format ---
  switch (field.type) {
    case "email":
      if (!EMAIL_RE.test(str)) return t.errEmail;
      break;
    case "tel":
      if (!PHONE_RE.test(str)) return t.errPhone;
      break;
    case "url":
      if (!isValidUrl(str)) return t.errUrl;
      break;
    case "radio":
    case "select":
      // Reject values that aren't in our own option list.
      if (field.options && !field.options.some((o) => o.value === str)) {
        return t.errRequired;
      }
      break;
    case "checkbox":
      if (field.options) {
        const allowed = new Set(field.options.map((o) => o.value));
        if (arr.some((v) => !allowed.has(v))) return t.errPickOne;
      }
      break;
  }

  return null;
}

/* -------------------------------------------------------------------------
 * Section / whole-form validation
 * ---------------------------------------------------------------------- */

export function validateSection(
  section: Section,
  values: Values,
  lang: Lang,
): Errors {
  const errors: Errors = {};
  for (const field of visibleFields(section.fields, values)) {
    const err = validateField(field, values[field.key], lang);
    if (err) errors[field.key] = err;
  }
  return errors;
}

export function validateAll(values: Values, lang: Lang): Errors {
  return sections.reduce<Errors>(
    (acc, s) => Object.assign(acc, validateSection(s, values, lang)),
    {},
  );
}

/* -------------------------------------------------------------------------
 * Server-side sanitising
 * ---------------------------------------------------------------------- */

/**
 * Rebuild the payload from our own field definitions rather than trusting the
 * shape the client sent. Anything not in `strings.ts` is dropped, hidden
 * fields are cleared, strings are trimmed and hard-truncated, and option
 * values are checked against the allow-list.
 */
export function sanitize(input: unknown): Values {
  const src = (input ?? {}) as Record<string, unknown>;
  const out: Values = {};

  // First pass: primitives, so `showIf` conditions can be evaluated.
  for (const field of allFields) {
    const raw = src[field.key];

    if (field.type === "checkbox") {
      const allowed = new Set(field.options?.map((o) => o.value) ?? []);
      out[field.key] = Array.isArray(raw)
        ? raw
            .filter((v): v is string => typeof v === "string")
            .filter((v) => allowed.has(v))
            .slice(0, 40)
        : [];
    } else {
      let s = typeof raw === "string" ? raw.trim() : "";
      if (field.maxLength) s = s.slice(0, field.maxLength);
      else s = s.slice(0, 5000);
      if (field.type === "url" && s) s = normalizeUrl(s);
      if (
        (field.type === "radio" || field.type === "select") &&
        s &&
        field.options &&
        !field.options.some((o) => o.value === s)
      ) {
        s = "";
      }
      out[field.key] = s;
    }
  }

  // Second pass: blank out anything that shouldn't have been asked.
  for (const field of allFields) {
    if (!isVisible(field, out)) {
      out[field.key] = field.type === "checkbox" ? [] : "";
    }
  }

  return out;
}
