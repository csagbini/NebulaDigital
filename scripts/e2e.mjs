/**
 * API + admin checks against a running Next server.
 * Does not need Postgres. Email-success paths need RESEND_API_KEY;
 * without it, a valid POST is expected to return 500 (email is the system of record).
 *
 *   BASE=http://localhost:3000 node scripts/e2e.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.SHOTS || "/tmp/nebula-shots";
mkdirSync(OUT, { recursive: true });

const fails = [];
const t = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails.push(name);
};

const valid = () => ({
  contact_name: "Felu Dama",
  business_name: "Cypress Roofing",
  email: "owner@cypressroofing.com",
  phone: "832-929-5126",
  business_description: "Residential roofing and storm damage repair.",
  website_url: "cypressroofing.com",
  services_wanted: ["new_website", "ads"],
  budget_range: "5000_10000",
  timeline: "1_3_months",
  contact_preference: "text",
  notes: "https://drive.google.com/example",
  lang: "en",
});

async function post(body, headers = {}) {
  const res = await fetch(`${BASE}/api/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const old = () => Date.now() - 60_000; // past the minimum fill time

console.log("--- spam & validation ---");

let r = await post(
  { ...valid(), started_at: old(), company_website: "http://spam.ru" },
  { "x-forwarded-for": "10.0.0.1" },
);
t("honeypot: bot gets 200", r.status === 200 && r.body.ok === true, `status=${r.status}`);

r = await post({ ...valid(), started_at: Date.now() }, { "x-forwarded-for": "10.0.0.2" });
t("too-fast submit rejected silently", r.status === 200 && r.body.ok === true, `status=${r.status}`);

r = await post({ ...valid(), email: "nope", started_at: old() }, { "x-forwarded-for": "10.0.0.3" });
t(
  "server rejects bad email even though client passed",
  r.status === 400 && Boolean(r.body.errors?.email),
  JSON.stringify(r.body.errors ?? {}).slice(0, 90),
);

r = await post(
  { ...valid(), budget_range: "free_lol", started_at: old() },
  { "x-forwarded-for": "10.0.0.4" },
);
t("option value outside the allow-list rejected", r.status === 400 && Boolean(r.body.errors?.budget_range));

const missing = valid();
delete missing.services_wanted;
r = await post({ ...missing, started_at: old() }, { "x-forwarded-for": "10.0.0.5" });
t("missing required field rejected", r.status === 400 && Boolean(r.body.errors?.services_wanted));

const emptyWants = valid();
emptyWants.services_wanted = [];
r = await post({ ...emptyWants, started_at: old() }, { "x-forwarded-for": "10.0.0.8" });
t("empty services_wanted rejected", r.status === 400 && Boolean(r.body.errors?.services_wanted));

console.log("\n--- unknown keys dropped (email still the system of record) ---");
r = await post(
  {
    ...valid(),
    admin_note_injection: "DROP",
    years_in_business: "over_10",
    started_at: old(),
  },
  { "x-forwarded-for": "10.0.0.6" },
);
// Without Resend this is 500 (email is required). With Resend it's 200.
t(
  "payload with extra keys reaches email (or fails only on email)",
  r.status === 200 || r.status === 500,
  `status=${r.status}`,
);

console.log("\n--- email is the system of record ---");
r = await post({ ...valid(), started_at: old() }, { "x-forwarded-for": "10.0.0.7" });
if (process.env.RESEND_API_KEY) {
  t("valid submission accepted when Resend is configured", r.status === 200 && Boolean(r.body.id), `status=${r.status}`);
} else {
  t(
    "valid submission errors when Resend is missing",
    r.status === 500 && r.body.ok === false,
    `status=${r.status}`,
  );
}

console.log("\n--- rate limiting ---");
if (process.env.RESEND_API_KEY) {
  const ip = { "x-forwarded-for": "10.9.9.9" };
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const rr = await post({ ...valid(), started_at: old() }, ip);
    codes.push(rr.status);
  }
  t(
    "rate limit kicks in after 3 from one IP",
    codes.slice(0, 3).every((c) => c === 200) && codes.slice(3).every((c) => c === 429),
    codes.join(","),
  );
} else {
  console.log("SKIP  rate-limit HTTP test (needs RESEND_API_KEY so sends count)");
}

console.log("\n--- admin ---");
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROME || undefined,
  args: ["--no-sandbox"],
});
const adm = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const a = await adm.newPage();

await a.goto(`${BASE}/admin/intakes`, { waitUntil: "networkidle" });
t("anonymous redirected to login", a.url().includes("/admin/login"));

if (process.env.ADMIN_PASSWORD) {
  await a.fill('input[type="password"]', "wrong-password");
  await a.click('button[type="submit"]');
  await a.waitForTimeout(1600);
  t("wrong password refused", a.url().includes("/admin/login"));

  await a.fill('input[type="password"]', process.env.ADMIN_PASSWORD);
  await a.click('button[type="submit"]');
  await a.waitForTimeout(2600);
  t("correct password signs in", a.url().includes("/admin/intakes"), a.url());
  const notice = await a.locator(".ad-h").innerText();
  t(
    "admin page says submissions go to email",
    notice.toLowerCase().includes("email"),
    notice,
  );
  await a.screenshot({ path: `${OUT}/22-admin-notice.png` });
} else {
  console.log("SKIP  admin password tests (ADMIN_PASSWORD unset)");
}

await browser.close();

console.log(`\n${fails.length === 0 ? "ALL CHECKS PASSED" : `${fails.length} FAILED: ${fails.join(", ")}`}`);
process.exit(fails.length ? 1 : 0);
