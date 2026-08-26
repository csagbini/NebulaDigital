import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/email";
import {
  clientIp,
  hashIp,
  isRateLimited,
  looksLikeBot,
  recordAttempt,
} from "@/lib/security";
import { type Lang } from "@/lib/strings";
import { sanitize, validateAll } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const lang: Lang = payload.lang === "es" ? "es" : "en";

  // --- spam gate -----------------------------------------------------
  // A bot gets a 200 and no email. Telling it that it failed just teaches
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
  // In-memory on this process. Resets when Node restarts. See SETUP.md.
  const ip = clientIp(request.headers);
  const ipHash = hashIp(ip);
  if (isRateLimited(ipHash)) {
    return NextResponse.json({ ok: false, rateLimited: true }, { status: 429 });
  }

  // --- notify --------------------------------------------------------
  // Email is the system of record. If Resend fails, the client should retry.
  const id = randomUUID();
  const sent = await sendNotification({
    id,
    row: values,
    lang,
  });

  if (!sent) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  recordAttempt(ipHash);
  return NextResponse.json({ ok: true, id });
}
