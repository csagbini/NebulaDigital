# Nebula Digital — site + client intake

The marketing site plus a bilingual client intake form at `/intake`. Submissions
are emailed to `NOTIFY_EMAIL`. There is no database.

## What changed vs. the old repo

The old repo was a single static `index.html` on GitHub Pages. GitHub Pages can
only serve files — it can't run server code — so the intake form (email, spam
protection, a password-gated admin notice) could not live there. This repo is a
Next.js app you run on a VPS (or any Node host).

The marketing homepage is still the original hand-written `public/index.html`.
`next.config.ts` rewrites `/` to it. The one start-here action is **Start a
project**, which goes to `/intake`. There is no Book a call or WhatsApp CTA.

## Editing the questions

Everything a client reads lives in **`src/lib/strings.ts`** — both languages,
in one file.

- Change any `en:` or `es:` string freely, then rebuild.
- **Don't** change a `key:` or an option `value:` unless you mean it. Those
  identify answers in the notification email.
- Adding a question: add a field to a section. The form, the validation, and
  the email all pick it up with no component changes.

## Environment variables

Set these on the VPS (systemd Environment=, a `.env` file, etc.):

| Variable | What it's for | Notes |
|---|---|---|
| `RESEND_API_KEY` | Sending the notification email | From resend.com/api-keys. Required for submit to succeed. |
| `RESEND_FROM` | Sender address | e.g. `Nebula Intake <intake@nebuladigital.io>` — needs the domain verified in Resend |
| `NOTIFY_EMAIL` | Who gets notified | Defaults to `nebuladigitalceo@gmail.com` if unset |
| `ADMIN_PASSWORD` | The `/admin/intakes` password | Optional. Only needed if you use the notice page. |
| `ADMIN_SESSION_SECRET` | Signs the admin session cookie | Any long random string. Changing it signs everyone out. |
| `IP_HASH_SALT` | Salts hashed IPs for rate limiting | Any long random string |

Generate the two secrets with:

```bash
openssl rand -hex 32
```

There is no `DATABASE_URL` and no Postgres. File uploads were dropped so the
app does not depend on Vercel Blob; the optional notes field accepts pasted
links, and clients can attach files when they reply to the follow-up.

## VPS deploy

Needs Node.js 20+ (the app is Next.js). Example:

```bash
npm install
npm run build
# set RESEND_API_KEY, RESEND_FROM, NOTIFY_EMAIL (and the admin secrets if you want /admin)
npm start
```

Put a reverse proxy (Caddy, nginx) in front on port 443. `npm start` listens
on port 3000 by default (`next start`).

## Security model

- **The client is not trusted.** `src/lib/validate.ts` runs in the browser for
  fast feedback and again on the server for real. `sanitize()` rebuilds the
  payload from the field definitions, so unknown keys are dropped and
  conditional fields that shouldn't have been asked are blanked.
- **Spam:** a hidden honeypot field plus a minimum fill time. Bots get a `200`
  and no email, so whoever wrote the bot doesn't learn they were caught.
- **Rate limiting** is an in-memory counter per hashed IP in this Node process
  (3 successful submissions per 6 hours). It resets when the process restarts.
  Failed email sends do not count, so a client can retry if Resend is down.
  That is enough on a single VPS; it would not hold up across many serverless
  instances.
- **Raw IPs are never stored**, only a salted hash used as the rate-limit key.
- **Email is the system of record.** If Resend is down or misconfigured, the
  API returns an error and the client can retry. There is no database fallback.
- **Admin auth** (if you use `/admin/intakes`) is a shared password checked in
  constant time, exchanged for an HMAC-signed `httpOnly` cookie. The page only
  tells you that submissions go to email — it does not list them.

## Local development

```bash
npm install
npm run dev
```

`/intake` renders without any env vars. Submitting needs `RESEND_API_KEY`
(and typically `RESEND_FROM`). There is no database to configure.

## Verification

```bash
node scripts/verify.mjs   # needs the dev server running
```

Drives a real browser through the single-page form at phone and desktop
widths and checks validation, refresh persistence, the language toggle, the
honeypot, the homepage CTA, and that `/admin/intakes` rejects anonymous
visitors.
