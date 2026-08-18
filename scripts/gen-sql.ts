/**
 * Writes the CREATE TABLE statement derived from src/lib/strings.ts.
 *
 *   npm run db:sql
 *
 * Then paste the contents of schema.sql into the Neon SQL editor (or pipe it
 * with psql). Re-run this after adding a question — it only ever emits
 * `create ... if not exists`, so it's safe to run again, but note that adding
 * a NEW question to an EXISTING table needs an `alter table add column`, which
 * this prints for you at the bottom.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { schemaSql } from "../src/lib/db";
import { dataFields } from "../src/lib/strings";

const alters = dataFields
  .map(
    (f) =>
      `alter table client_intakes add column if not exists ${f.key} ${f.type === "checkbox" ? "text[]" : "text"};`,
  )
  .join("\n");

const out = `${schemaSql()}
-- ---------------------------------------------------------------------------
-- Safe to run against an existing table: adds any question added since it was
-- created, and does nothing for columns that are already there.
-- ---------------------------------------------------------------------------

${alters}
`;

const path = join(process.cwd(), "schema.sql");
writeFileSync(path, out);
console.log(`Wrote ${path} — ${dataFields.length} answer columns.`);
