import postgres from "postgres";
import { dataFields, type Field } from "./strings";

/**
 * We use postgres.js rather than a vendor-specific driver so this app runs
 * against any Postgres — Neon in production, a local server in development,
 * somewhere else later if that changes. Nothing here is tied to one host.
 *
 * The connection string is server-only. It is never bundled into client code:
 * every query runs inside a route handler or a server component.
 */

let client: ReturnType<typeof postgres> | null = null;

function conn(): string {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error(
      "No database connection string. Set DATABASE_URL in your Vercel project.",
    );
  }
  return url;
}

/**
 * Reads TLS intent out of the connection string. Neon and most hosted
 * Postgres providers append `?sslmode=require`; a local server usually has no
 * TLS at all. Returning `false` for `disable`/absent keeps local development
 * working without pretending the connection is encrypted when it isn't.
 */
function sslMode(url: string): "require" | "prefer" | false {
  const mode = /[?&]sslmode=([a-z-]+)/i.exec(url)?.[1]?.toLowerCase();
  if (!mode) return false;
  if (mode === "disable") return false;
  if (mode === "prefer" || mode === "allow") return "prefer";
  return "require"; // require / verify-ca / verify-full
}

export function sql() {
  if (!client) {
    const url = conn();
    client = postgres(url, {
      // Serverless functions are short-lived and numerous, so hold very few
      // connections each and let them go quickly. Use the *pooled* connection
      // string from Neon in production.
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
      // Prepared statements don't survive a connection pooler in transaction
      // mode, which is what Neon's pooled endpoint uses.
      prepare: false,
      // TLS is decided by the connection string (`?sslmode=require`), not by
      // NODE_ENV. Hardcoding it to NODE_ENV means a production build pointed
      // at a non-TLS database fails with an unhelpful ECONNRESET, and it
      // silently overrides whatever the URL actually asked for.
      ssl: sslMode(url),
    });
  }
  return client;
}

/* -------------------------------------------------------------------------
 * Schema, derived from strings.ts so the table can never drift from the form
 * ---------------------------------------------------------------------- */

function columnType(field: Field): string {
  return field.type === "checkbox" ? "text[]" : "text";
}

/** Generates the CREATE TABLE statement. Run via `npm run db:sql`. */
export function schemaSql(): string {
  const cols = dataFields.map((f) => `  ${f.key} ${columnType(f)}`).join(",\n");

  return `-- Generated from src/lib/strings.ts — do not hand-edit.
-- Regenerate with: npm run db:sql

create extension if not exists pgcrypto;

create table if not exists client_intakes (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  status        text not null default 'new'
                check (status in ('new','reviewed','quoted')),
  internal_notes text not null default '',

  -- submission metadata
  lang          text not null default 'en',
  ip_hash       text,
  user_agent    text,
  files         jsonb not null default '[]'::jsonb,

  -- answers
${cols}
);

create index if not exists client_intakes_created_at_idx
  on client_intakes (created_at desc);

create index if not exists client_intakes_status_idx
  on client_intakes (status);

-- Used by the rate limiter to count recent submissions per connection.
create index if not exists client_intakes_ip_recent_idx
  on client_intakes (ip_hash, created_at desc);
`;
}

/* -------------------------------------------------------------------------
 * Row type
 * ---------------------------------------------------------------------- */

export interface IntakeRow {
  id: string;
  created_at: string;
  status: "new" | "reviewed" | "quoted";
  internal_notes: string;
  lang: string;
  ip_hash: string | null;
  user_agent: string | null;
  files: { name: string; url: string; size: number; type: string }[];
  [key: string]: unknown;
}
