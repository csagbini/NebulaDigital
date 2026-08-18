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
  files: { name: string; url: string; size: number }[];
  adminUrl: string;
}

function buildHtml({ row, lang, files, adminUrl }: NotifyArgs): string {
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

  const fileList = files.length
    ? `<tr><td style="padding:30px 0 10px">
         <div style="color:${BRAND.warm};font-size:11px;letter-spacing:.24em;text-transform:uppercase;font-weight:600">Files (${files.length})</div>
       </td></tr>
       ${files
         .map(
           (f) => `<tr><td style="padding:5px 0">
             <a href="${esc(f.url)}" style="color:${BRAND.ink};font-size:14px">${esc(f.name)}</a>
             <span style="color:${BRAND.faint};font-size:12px"> · ${(f.size / 1024 / 1024).toFixed(2)} MB</span>
           </td></tr>`,
         )
         .join("")}`
    : "";

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

        <tr><td style="padding:24px 0 4px">
          <a href="${esc(adminUrl)}" style="display:inline-block;background:${BRAND.ink};color:#000;text-decoration:none;font-weight:600;font-size:14px;padding:13px 26px;border-radius:40px">Open in admin</a>
        </td></tr>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${body}
          ${fileList}
        </table>

        <tr><td style="padding-top:30px;border-top:1px solid ${BRAND.line}">
          <div style="color:${BRAND.faint};font-size:12px">Submitted in ${lang === "es" ? "Spanish" : "English"} · Nebula Digital · Houston, TX</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Sends the notification. Deliberately never throws: if Resend is down or the
 * key is missing we still want the submission saved and the client to see a
 * thank-you screen. The error is logged for us instead.
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
