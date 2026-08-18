import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "./db";
import { HONEYPOT_FIELD } from "./security.client";

export { HONEYPOT_FIELD };

/* =========================================================================
 * Client fingerprinting
 * ====================================================================== */

/**
 * We never store a raw IP address. Hashing it with a server-side secret gives
 * us enough to rate-limit repeat submitters without keeping personal data
 * about people who filled in a form.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "nebula-intake-fallback-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/* =========================================================================
 * Rate limiting
 * ====================================================================== */

const MAX_PER_WINDOW = 3;
const WINDOW_HOURS = 6;

/**
 * Durable rate limit. Serverless functions don't share memory between
 * invocations, so an in-process counter would reset constantly and let a
 * script straight through. Counting rows in Postgres survives cold starts.
 */
export async function isRateLimited(ipHash: string): Promise<boolean> {
  try {
    const db = sql();
    const rows = (await db`
      select count(*)::int as n
      from client_intakes
      where ip_hash = ${ipHash}
        and created_at > now() - ${`${WINDOW_HOURS} hours`}::interval
    `) as { n: number }[];
    return (rows[0]?.n ?? 0) >= MAX_PER_WINDOW;
  } catch {
    // If the check itself fails, let the submission through rather than
    // blocking a real client because of an infrastructure problem.
    return false;
  }
}

/* =========================================================================
 * Honeypot
 * ====================================================================== */

/**
 * Two signals, both invisible to a real person:
 *   1. `company_website` is a hidden input. Humans never fill it; bots that
 *      auto-complete every field do.
 *   2. `started_at` is set when the form opens. A human takes minutes to get
 *      through six sections — anything under a few seconds is scripted.
 */
const MIN_FILL_SECONDS = 8;

export function looksLikeBot(payload: {
  [HONEYPOT_FIELD]?: unknown;
  started_at?: unknown;
}): boolean {
  const honey = payload[HONEYPOT_FIELD];
  if (typeof honey === "string" && honey.trim() !== "") return true;

  const started = Number(payload.started_at);
  if (Number.isFinite(started) && started > 0) {
    const elapsed = (Date.now() - started) / 1000;
    if (elapsed < MIN_FILL_SECONDS) return true;
  }
  return false;
}

/* =========================================================================
 * Admin session
 * ====================================================================== */

export const ADMIN_COOKIE = "nebula_admin";
const SESSION_DAYS = 14;

function sessionSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

/** Constant-time compare, so an attacker can't time their way to the answer. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Hash both sides first so the compare length doesn't leak the real length.
  return safeEqual(
    createHash("sha256").update(candidate).digest("hex"),
    createHash("sha256").update(expected).digest("hex"),
  );
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = String(expires);
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 1) return false;

  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);

  try {
    if (!safeEqual(sig, sign(payload))) return false;
  } catch {
    return false;
  }

  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
