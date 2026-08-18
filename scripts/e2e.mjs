/**
 * End-to-end test against a real database.
 * Requires: dev server on :3000 and DATABASE_URL pointing at a live Postgres.
 */
import { chromium } from "playwright";
import postgres from "postgres";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3200";
const OUT = "/home/claude/shots";
mkdirSync(OUT, { recursive: true });

const db = postgres("postgres://postgres@127.0.0.1:5433/nebula", { prepare: false });
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
  years_in_business: "3_10",
  customer_location: "Houston metro, 30 mile radius",
  typical_customer: "Homeowners 35-65 with storm damage",
  differentiator: "Same-week turnaround and we handle the insurance claim",
  has_website: "yes",
  website_url: "cypressroofing.com",
  website_dislikes: "Slow, looks dated, no way to request a quote.",
  primary_goal: "forms",
  success_metric: "10 qualified quote requests a month",
  sites_liked: "example.com — clean, fast, obvious call to action",
  sites_disliked: "",
  pages_needed: ["home", "services", "contact"],
  copy_status: "have_some",
  logo_status: "have_good",
  photo_status: "few",
  site_languages: ["en", "es"],
  domain_status: "own_login",
  budget_range: "5000_10000",
  timeline: "1_3_months",
  decision_makers: "just_me",
  contact_preference: "text",
  lang: "en",
  files: [],
});

async function post(body, headers = {}) {
  const res = await fetch(`${BASE}/api/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

const count = async () => Number((await db`select count(*)::int as n from client_intakes`)[0].n);
const old = () => Date.now() - 60_000; // past the minimum fill time

console.log("--- spam & validation ---");
let before = await count();

let r = await post({ ...valid(), started_at: old(), company_website: "http://spam.ru" },
  { "x-forwarded-for": "10.0.0.1" });
t("honeypot: bot gets 200 and no row",
  r.status === 200 && (await count()) === before, `status=${r.status}`);

before = await count();
r = await post({ ...valid(), started_at: Date.now() }, { "x-forwarded-for": "10.0.0.2" });
t("too-fast submit rejected silently",
  r.status === 200 && (await count()) === before, `status=${r.status}`);

r = await post({ ...valid(), email: "nope", started_at: old() }, { "x-forwarded-for": "10.0.0.3" });
t("server rejects bad email even though client passed",
  r.status === 400 && Boolean(r.body.errors?.email), JSON.stringify(r.body.errors ?? {}).slice(0, 90));

r = await post({ ...valid(), budget_range: "free_lol", started_at: old() }, { "x-forwarded-for": "10.0.0.4" });
t("option value outside the allow-list rejected",
  r.status === 400 && Boolean(r.body.errors?.budget_range));

const missing = valid();
delete missing.success_metric;
r = await post({ ...missing, started_at: old() }, { "x-forwarded-for": "10.0.0.5" });
t("missing required field rejected", r.status === 400 && Boolean(r.body.errors?.success_metric));

console.log("\n--- hidden-field smuggling ---");
r = await post(
  { ...valid(), has_website: "no", website_url: "https://evil.example", website_dislikes: "x",
    admin_note_injection: "DROP", started_at: old() },
  { "x-forwarded-for": "10.0.0.6" },
);
t("conditional payload accepted", r.status === 200, `status=${r.status}`);
const smuggled = (await db`select website_url, website_dislikes from client_intakes order by created_at desc limit 1`)[0];
t("hidden conditional values blanked server-side",
  smuggled.website_url === "" && smuggled.website_dislikes === "",
  `url="${smuggled.website_url}"`);

console.log("\n--- real submission ---");
before = await count();
r = await post({ ...valid(), started_at: old() }, { "x-forwarded-for": "10.0.0.7" });
t("valid submission accepted", r.status === 200 && Boolean(r.body.id), `status=${r.status}`);
t("row written", (await count()) === before + 1);

const row = (await db`select * from client_intakes where id = ${r.body.id}::uuid`)[0];
t("array column stored as array",
  Array.isArray(row.pages_needed) && row.pages_needed.length === 3,
  JSON.stringify(row.pages_needed));
t("defaults applied", row.status === "new" && row.internal_notes === "");
t("raw IP not stored", row.ip_hash && !String(row.ip_hash).includes("10.0.0.7"),
  `ip_hash=${String(row.ip_hash).slice(0, 12)}…`);
t("language recorded", row.lang === "en");

console.log("\n--- rate limiting ---");
const ip = { "x-forwarded-for": "10.9.9.9" };
const codes = [];
for (let i = 0; i < 5; i++) {
  const rr = await post({ ...valid(), started_at: old() }, ip);
  codes.push(rr.status);
}
t("rate limit kicks in after 3 from one IP",
  codes.slice(0, 3).every((c) => c === 200) && codes.slice(3).every((c) => c === 429),
  codes.join(","));

console.log("\n--- browser: full journey ---");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const p = await ctx.newPage();
const started = Date.now();

await p.goto(`${BASE}/intake`, { waitUntil: "networkidle" });
await p.waitForTimeout(600);
await p.click(".ik-btn-solid");
await p.waitForTimeout(500);

// s1
await p.fill('[data-field="contact_name"] input', "Browser Tester");
await p.fill('[data-field="business_name"] input', "Playwright Plumbing");
await p.fill('[data-field="email"] input', "test@playwrightplumbing.com");
await p.fill('[data-field="phone"] input', "713-555-0100");
await p.fill('[data-field="business_description"] textarea', "Emergency plumbing, 24/7.");
await p.selectOption('[data-field="years_in_business"] select', "1_3");
await p.fill('[data-field="customer_location"] textarea', "Houston");
await p.fill('[data-field="typical_customer"] textarea', "Homeowners");
await p.fill('[data-field="differentiator"] textarea', "We actually answer the phone.");
await p.click('[data-field="has_website"] .ik-opt >> nth=1'); // No
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);

// s2
await p.click('[data-field="primary_goal"] .ik-opt >> nth=0');
await p.fill('[data-field="success_metric"] textarea', "20 calls a month");
await p.fill('[data-field="sites_liked"] textarea', "roto-rooter.com, clear pricing");
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);

// s3
await p.click('[data-field="pages_needed"] .ik-opt >> nth=0');
await p.click('[data-field="pages_needed"] .ik-opt >> nth=2');
await p.click('[data-field="copy_status"] .ik-opt >> nth=2');
await p.click('[data-field="logo_status"] .ik-opt >> nth=1');
await p.click('[data-field="photo_status"] .ik-opt >> nth=2');
await p.click('[data-field="site_languages"] .ik-opt >> nth=0');
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);

// s4
await p.click('[data-field="domain_status"] .ik-opt >> nth=0');
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);

// s5
await p.click('[data-field="budget_range"] .ik-opt >> nth=1');
await p.click('[data-field="timeline"] .ik-opt >> nth=0');
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);

// s6
await p.click('[data-field="decision_makers"] .ik-opt >> nth=0');
await p.click('[data-field="contact_preference"] .ik-opt >> nth=1');
await p.screenshot({ path: `${OUT}/20-final-section.png` });

// honour the minimum fill time
const elapsed = (Date.now() - started) / 1000;
if (elapsed < 10) await p.waitForTimeout((10 - elapsed) * 1000);

const beforeUi = await count();
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(3500);

t("thank-you screen shown", await p.locator(".ik-tick").isVisible());
await p.screenshot({ path: `${OUT}/21-thankyou.png` });
t("browser submission written", (await count()) === beforeUi + 1);

const uiRow = (await db`select * from client_intakes order by created_at desc limit 1`)[0];
t("browser answers stored correctly",
  uiRow.business_name === "Playwright Plumbing" && uiRow.has_website === "no",
  `${uiRow.business_name} / has_website=${uiRow.has_website}`);
t("hidden conditional stayed empty from the UI too", uiRow.website_url === "");

// saved progress cleared after submit
const ls = await p.evaluate(() => localStorage.getItem("nebula_intake_v1"));
t("saved progress cleared after submit", ls === null);

console.log("\n--- admin ---");
const adm = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const a = await adm.newPage();

await a.goto(`${BASE}/admin/intakes`, { waitUntil: "networkidle" });
t("anonymous redirected to login", a.url().includes("/admin/login"));

await a.fill('input[type="password"]', "wrong-password");
await a.click('button[type="submit"]');
await a.waitForTimeout(1600);
t("wrong password refused", a.url().includes("/admin/login"));

await a.fill('input[type="password"]', "test-admin-password-9f3a");
await a.click('button[type="submit"]');
await a.waitForTimeout(2600);
t("correct password signs in", a.url().includes("/admin/intakes"), a.url());

const rowCount = await a.locator(".ad-row").count();
t("submissions listed", rowCount > 0, `${rowCount} rows`);
await a.screenshot({ path: `${OUT}/22-admin-list.png` });

// newest first
const firstBiz = await a.locator(".ad-biz").first().innerText();
t("sorted newest first", firstBiz === "Playwright Plumbing", firstBiz);

// expand
await a.locator(".ad-row-head").first().click();
await a.waitForTimeout(700);
t("expands to full answers", await a.locator(".ad-qa").first().isVisible());
await a.screenshot({ path: `${OUT}/23-admin-expanded.png`, fullPage: true });

// status change
await a.locator(".ad-tools .ad-chip").nth(2).click(); // quoted
await a.waitForTimeout(1400);
const st = (await db`select status from client_intakes where id = ${uiRow.id}::uuid`)[0].status;
t("status change persists", st === "quoted", st);

// notes
await a.fill(".ad-notes", "Good fit. Quote 7.5k, mention the Spanish page.");
await a.waitForTimeout(1800);
const notes = (await db`select internal_notes from client_intakes where id = ${uiRow.id}::uuid`)[0].internal_notes;
t("internal notes persist", notes.includes("7.5k"), notes.slice(0, 40));

// print view
const pr = await adm.newPage();
await pr.goto(`${BASE}/admin/intakes/${uiRow.id}/print`, { waitUntil: "networkidle" });
await pr.waitForTimeout(900);
t("printable summary renders", await pr.locator(".pr-head h1").isVisible());
const prTitle = await pr.locator(".pr-head h1").innerText();
t("printable summary shows the business", prTitle === "Playwright Plumbing", prTitle);
const dashCount = await pr.locator(".pr-qa dd").filter({ hasText: /^—$/ }).count();
t("printable summary omits unanswered questions", dashCount === 0, `${dashCount} blanks`);
await pr.screenshot({ path: `${OUT}/24-print.png`, fullPage: true });

// print page must also be gated
const anon = await browser.newContext();
const an = await anon.newPage();
await an.goto(`${BASE}/admin/intakes/${uiRow.id}/print`, { waitUntil: "networkidle" });
t("print page gated for anonymous", an.url().includes("/admin/login"), an.url());

// admin API gated
const apiRes = await fetch(`${BASE}/api/admin/intake`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ id: uiRow.id, status: "new" }),
});
t("admin API rejects unauthenticated writes", apiRes.status === 401, `status=${apiRes.status}`);

await browser.close();
await db.end();

console.log(`\n${fails.length === 0 ? "ALL CHECKS PASSED" : `${fails.length} FAILED: ${fails.join(", ")}`}`);
process.exit(fails.length ? 1 : 0);
