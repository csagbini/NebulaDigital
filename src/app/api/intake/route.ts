import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendNotification } from "@/lib/email";
import {
  clientIp,
  hashIp,
  isRateLimited,
  looksLikeBot,
} from "@/lib/security";
import { dataFields, type Lang } from "@/lib/strings";
import { sanitize, validateAll } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

function cleanFiles(raw: unknown): UploadedFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => ({
      name: String(f.name ?? "file").slice(0, 250),
      url: String(f.url ?? ""),
      size: Number(f.size ?? 0),
      type: String(f.type ?? "").slice(0, 120),
    }))
    // Only accept URLs that actually came from our own Blob store.
    .filter((f) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(f.url))
    .slice(0, 10);
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const lang: Lang = payload.lang === "es" ? "es" : "en";

  // --- spam gate -----------------------------------------------------
  // A bot gets a 200 and no row. Telling it that it failed just teaches
  // whoever wrote it to try harder.
  if (looksLikeBot(payload)) {
    return NextResponse.json({ ok: true });
  }

  // --- re-validate on the server -------------------------------------
  // The client already checked these, but the client is not trustworthy:
  // anyone can POST here directly. `sanitize` rebuilds the payload from our
  // own field definitions, so unknown keys and hidden-field values vanish.
  const values = sanitize(payload);
  const errors = validateAll(values, lang);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  // --- rate limit ----------------------------------------------------
  const ip = clientIp(request.headers);
  const ipHash = hashIp(ip);
  if (await isRateLimited(ipHash)) {
    return NextResponse.json({ ok: false, rateLimited: true }, { status: 429 });
  }

  const files = cleanFiles(payload.files);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);

  // --- insert --------------------------------------------------------
  // Column names come from our own strings.ts, never from the request, so
  // building the list here can't be injected into. Values are parameterised.
  const columns = ["lang", "ip_hash", "user_agent", "files", ...dataFields.map((f) => f.key)];
  const params: unknown[] = [
    lang,
    ipHash,
    userAgent,
    JSON.stringify(files),
    ...dataFields.map((f) => values[f.key] ?? (f.type === "checkbox" ? [] : "")),
  ];
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

  let id: string;
  try {
    const db = sql();
    const rows = (await db.unsafe(
      `insert into client_intakes (${columns.join(", ")})
       values (${placeholders})
       returning id`,
      params as never[],
    )) as unknown as { id: string }[];
    id = rows[0].id;
  } catch (err) {
    console.error("[intake] Insert failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // --- notify --------------------------------------------------------
  // Deliberately after the insert and never fatal: if email fails we still
  // have the submission, and the client should still see the thank-you.
  const origin = new URL(request.url).origin;
  await sendNotification({
    id,
    row: { ...values, files },
    lang,
    files,
    adminUrl: `${origin}/admin/intakes?open=${id}`,
  });

  return NextResponse.json({ ok: true, id });
}
