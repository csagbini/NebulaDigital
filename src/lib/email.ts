import { Resend } from "resend";
import { type Lang, fieldByKey, optionLabel } from "./strings";
import { buildSummary, headline } from "./summary";

const BRAND = {
  bg: "#050506",
  panel: "#0e0e10",
  ink: "#f4f3f1",
  muted: "#8a8a90",
  faint: "#5a5a60",
  warm: "#e8b873",
  line: "#22222a",
};

function label(key: string, value: string, lang: Lang): string {
  const f = fieldByKey(key);
  if (!f || !value) return value || "—";
  return optionLabel(f, value, lang);
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface NotifyArgs {
  id: string;
  row: Record<string, unknown>;
  lang: Lang;
}

function buildHtml({ id, row, lang }: NotifyArgs): string {
  const h = headline(row);
  const summary = buildSummary(row, lang, false);

  const facts = [
    ["Contact", `${esc(h.contact)} · ${esc(h.email)} · ${esc(h.phone)}`],
    ["Goal", esc(label("primary_goal", h.goal, lang))],
    ["Budget", esc(label("budget_range", h.budget, lang))],
    ["Timeline", esc(label("timeline", h.timeline, lang))],
  ]
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:7px 0;color:${BRAND.faint};font-size:12px;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;vertical-align:top;width:96px">${k}</td>
        <td style="padding:7px 0;color:${BRAND.ink};font-size:15px">${v}</td>
      </tr>`,
    )
    .join("");

  const body = summary
    .map(
      (sec) => `
      <tr><td style="padding:30px 0 12px">
        <div style="color:${BRAND.warm};font-size:11px;letter-spacing:.24em;text-transform:uppercase;font-weight:600">${esc(sec.title)}</div>
      </td></tr>
      ${sec.items
        .map(
          (it) => `
        <tr><td style="padding:0 0 16px;border-bottom:1px solid ${BRAND.line}">
          <div style="color:${BRAND.muted};font-size:13px;padding-bottom:5px">${esc(it.question)}</div>
          <div style="color:${BRAND.ink};font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(it.answer)}</div>
        </td></tr>`,
        )
        .join("")}`,
    )
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.panel};border:1px solid ${BRAND.line};border-radius:14px;padding:34px">

        <tr><td style="padding-bottom:6px">
          <div style="color:${BRAND.faint};font-size:11px;letter-spacing:.28em;text-transform:uppercase">New client intake</div>
        </td></tr>
        <tr><td style="padding-bottom:22px">
          <div style="color:${BRAND.ink};font-size:27px;font-weight:600;letter-spacing:-.02em">${esc(h.business)}</div>
        </td></tr>

        <tr><td style="padding-bottom:6px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${facts}</table>
        </td></tr>

        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${body}
          </table>
        </td></tr>

        <tr><td style="padding-top:30px;border-top:1px solid ${BRAND.line}">
          <div style="color:${BRAND.faint};font-size:12px">Submitted in ${lang === "es" ? "Spanish" : "English"} · ref ${esc(id.slice(0, 8))} · Nebula Digital · Houston, TX</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText({ id, row, lang }: NotifyArgs): string {
  const h = headline(row);
  const summary = buildSummary(row, lang, false);
  const lines = [
    `New client intake — ${h.business}`,
    `Contact: ${h.contact} · ${h.email} · ${h.phone}`,
    `Goal: ${label("primary_goal", h.goal, lang)}`,
    `Budget: ${label("budget_range", h.budget, lang)}`,
    `Timeline: ${label("timeline", h.timeline, lang)}`,
    "",
  ];

  for (const sec of summary) {
    lines.push(sec.title);
    lines.push("-".repeat(sec.title.length));
    for (const it of sec.items) {
      lines.push(`${it.question}`);
      lines.push(it.answer);
      lines.push("");
    }
  }

  lines.push(
    `Submitted in ${lang === "es" ? "Spanish" : "English"} · ref ${id.slice(0, 8)}`,
  );
  return lines.join("\n");
}

/**
 * Email is the system of record. Returns false if Resend is unconfigured or
 * rejects the message — the API treats that as a failed submission.
 */
export async function sendNotification(args: NotifyArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL ?? "nebuladigitalceo@gmail.com";
  const from = process.env.RESEND_FROM ?? "Nebula Intake <onboarding@resend.dev>";

  if (!key) {
    console.error("[intake] RESEND_API_KEY missing — notification not sent.");
    return false;
  }

  const h = headline(args.row);

  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: h.email || undefined,
      subject: `New intake — ${h.business}${h.budget ? ` · ${label("budget_range", h.budget, args.lang)}` : ""}`,
      html: buildHtml(args),
      text: buildText(args),
    });
    if (error) {
      console.error("[intake] Resend rejected the message:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[intake] Notification failed:", err);
    return false;
  }
}
