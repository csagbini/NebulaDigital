/**
 * Turns a stored row into readable question/answer pairs. Shared by the
 * notification email, the admin expand view and the printable summary, so all
 * three always show the same thing.
 */

import {
  type Field,
  type Lang,
  optionLabel,
  sections,
} from "./strings";
import { isVisible, type Values } from "./validate";

export interface SummaryItem {
  key: string;
  question: string;
  answer: string;
  empty: boolean;
}

export interface SummarySection {
  id: string;
  title: string;
  items: SummaryItem[];
}

function renderAnswer(
  field: Field,
  raw: unknown,
  lang: Lang,
): { text: string; empty: boolean } {
  if (field.type === "checkbox") {
    const arr = Array.isArray(raw) ? (raw as string[]) : [];
    if (arr.length === 0) return { text: "—", empty: true };
    return {
      text: arr.map((v) => optionLabel(field, v, lang)).join(", "),
      empty: false,
    };
  }

  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return { text: "—", empty: true };

  if (field.options) {
    return { text: optionLabel(field, s, lang), empty: false };
  }
  return { text: s, empty: false };
}

/**
 * @param includeEmpty  the printable proposal summary hides unanswered
 *                      optional questions; the admin view shows everything.
 */
export function buildSummary(
  row: Record<string, unknown>,
  lang: Lang = "en",
  includeEmpty = true,
): SummarySection[] {
  const values = row as Values;

  return sections
    .map((section) => ({
      id: section.id,
      title: section.title[lang],
      items: section.fields
        .filter((f) => f.type !== "file")
        .filter((f) => isVisible(f, values))
        .map((f) => {
          const { text, empty } = renderAnswer(f, row[f.key], lang);
          return {
            key: f.key,
            question: f.label[lang],
            answer: text,
            empty,
          };
        })
        .filter((item) => includeEmpty || !item.empty),
    }))
    .filter((s) => s.items.length > 0);
}

/** A few key facts for the email subject line and the admin table. */
export function headline(row: Record<string, unknown>) {
  return {
    business: (row.business_name as string) || "Unnamed business",
    contact: (row.contact_name as string) || "",
    email: (row.email as string) || "",
    phone: (row.phone as string) || "",
    budget: (row.budget_range as string) || "",
    goal: (row.primary_goal as string) || "",
    timeline: (row.timeline as string) || "",
  };
}
