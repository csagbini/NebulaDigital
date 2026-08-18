# Nebula Digital — site + client intake

The marketing site plus a bilingual client intake form at `/intake` and an admin
dashboard at `/admin/intakes`.

## What changed vs. the old repo

The old repo was a single static `index.html` on GitHub Pages. GitHub Pages can
only serve files — it can't run server code — so the intake form (database
writes, email, spam protection, a password-gated admin page) could not live
there. This repo is a Next.js app deployed on Vercel instead.

**Your homepage did not change.** `public/index.html` is the original file,
byte for byte. `next.config.ts` rewrites `/` to it. Edit it exactly the way you
always have — the Next app only adds routes alongside it.

## Editing the questions

Everything a client reads lives in **`src/lib/strings.ts`** — both languages,
in one file.

- Change any `en:` or `es:` string freely, then redeploy.
- **Don't** change a `key:` or an option `value:`. Those are database column
  names and stored values; renaming one orphans every existing submission.
- Adding a question: add a field to a section, run `npm run db:sql`, and paste
  the generated `alter table` lines into the Neon SQL editor. The form, the
  validation, the admin view and the printable summary all pick it up with no
  component changes.

## Environment variables

Set these in the Vercel project (Settings → Environment Variables):

| Variable | What it's for | Notes |
|---|---|---|
| `DATABASE_URL` | Neon Postgres connection string | Set automatically by `vercel install neon` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob file uploads | Set automatically when you create the Blob store |
| `RESEND_API_KEY` | Sending the notification email | From resend.com/api-keys |
| `RESEND_FROM` | Sender address | e.g. `Nebula Intake <intake@nebuladigital.io>` — needs the domain verified in Resend |
| `NOTIFY_EMAIL` | Who gets notified | `nebuladigitalceo@gmail.com` |
| `ADMIN_PASSWORD` | The `/admin/intakes` password | Use something long. This is the only thing protecting client data. |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie | Any long random string. Changing it signs everyone out. |
| `IP_HASH_SALT` | Salts hashed IPs for rate limiting | Any long random string |

Generate the two secrets with:

```bash
openssl rand -hex 32
```

## Database

```bash
npm run db:sql        # writes schema.sql from src/lib/strings.ts
```

Then paste `schema.sql` into the Neon SQL editor. It's safe to re-run.

## Security model

Worth understanding, because it's different from the Supabase plan:

- **The database is server-only.** The connection string never reaches the
  browser — every query runs in a route handler or server component. There's no
  RLS because there's no public database endpoint to protect.
- **The client is not trusted.** `src/lib/validate.ts` runs in the browser for
  fast feedback and again on the server for real. `sanitize()` rebuilds the
  payload from the field definitions, so unknown keys are dropped and
  conditional fields that shouldn't have been asked are blanked.
- **Spam:** a hidden honeypot field plus a minimum fill time. Bots get a `200`
  and no row, so whoever wrote the bot doesn't learn they were caught.
- **Rate limiting** counts recent rows per hashed IP in Postgres. An in-memory
  counter would be useless on serverless — each invocation gets fresh memory.
- **Raw IPs are never stored**, only a salted hash.
- **Admin auth** is a shared password checked in constant time, exchanged for an
  HMAC-signed `httpOnly` cookie. JavaScript can't read it, so XSS can't steal
  the session.
- **Uploaded files** go to Blob with `addRandomSuffix`, so URLs are
  unguessable — but they are publicly readable to anyone holding the URL. If
  clients will upload genuinely sensitive documents, switch to private blobs.

## Local development

```bash
npm install
npm run dev
```

`/intake` renders without a database. Submitting needs `DATABASE_URL`.

## Verification

```bash
node scripts/verify.mjs   # needs the dev server running
```

Drives a real browser through the form at phone and desktop widths and checks
validation, conditional fields, refresh persistence, the language toggle, the
honeypot, and that `/admin/intakes` rejects anonymous visitors.
