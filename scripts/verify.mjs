import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/home/claude/shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const fails = [];

function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails.push(name);
}

// The container ships Chromium build 1194; the npm playwright package wants a
// newer one. Point at what's actually here rather than downloading a browser.
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

/* ---------------------------------------------------------------- PHONE */
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const p = await phone.newPage();

await p.goto(`${BASE}/intake`, { waitUntil: "networkidle" });
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/01-form-phone.png` });
check("form renders on one page", await p.locator('[data-field="contact_name"]').isVisible());
check("intro is on the form, not a separate step", await p.locator(".ik-title").innerText().then((t) => t.includes("Tell us")));
check("all key fields are on the same page",
  (await p.locator('[data-field="services_wanted"]').isVisible()) &&
  (await p.locator('[data-field="budget_range"]').isVisible()) &&
  (await p.locator('[data-field="timeline"]').isVisible()) &&
  (await p.locator('[data-field="contact_preference"]').isVisible()) &&
  (await p.locator('[data-field="notes"]').isVisible()),
);
check("no progress / step chrome",
  (await p.locator(".ik-prog").count()) === 0 &&
  (await p.locator(".ik-steps").count()) === 0,
);
check("dropped fields are gone",
  (await p.locator('[data-field="years_in_business"]').count()) === 0 &&
  (await p.locator('[data-field="typical_customer"]').count()) === 0 &&
  (await p.locator('[data-field="pages_needed"]').count()) === 0 &&
  (await p.locator('[data-field="has_website"]').count()) === 0,
);

// language toggle + persistence
await p.click(".ik-lang");
await p.waitForTimeout(400);
const esTitle = await p.locator(".ik-title").innerText();
check("ES toggle switches copy", esTitle.includes("Cuéntanos"), esTitle);
await p.screenshot({ path: `${OUT}/02-form-phone-es.png` });

await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(900);
const afterReload = await p.locator(".ik-title").innerText();
check("language survives reload", afterReload.includes("Cuéntanos"), afterReload);

// back to English for the rest
await p.click(".ik-lang");
await p.waitForTimeout(400);

// validation: submit with nothing filled
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(700);
const errCount = await p.locator(".ik-err").count();
check("empty form blocks submit", errCount > 0, `${errCount} errors shown`);
await p.screenshot({ path: `${OUT}/03-validation-phone.png` });

// bad email specifically
await p.fill('[data-field="email"] input', "not-an-email");
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(500);
const emailErr = await p.locator('[data-field="email"] .ik-err').innerText();
check("invalid email caught", emailErr.toLowerCase().includes("valid"), emailErr);

// fill the short form
await p.fill('[data-field="contact_name"] input', "Felu Dama");
await p.fill('[data-field="business_name"] input', "Test Roofing Co");
await p.fill('[data-field="email"] input', "felu@example.com");
await p.fill('[data-field="phone"] input', "832-929-5126");
await p.fill('[data-field="business_description"] textarea', "Residential roofing and storm repair.");
await p.fill('[data-field="website_url"] input', "testroofing.com");
await p.click('[data-field="services_wanted"] .ik-opt >> nth=0');
await p.click('[data-field="services_wanted"] .ik-opt >> nth=2');
await p.waitForTimeout(300);
const onCount = await p.locator('[data-field="services_wanted"] .ik-opt.on').count();
check("multi-select takes multiple", onCount === 2, `${onCount} selected`);
await p.click('[data-field="budget_range"] .ik-opt >> nth=2');
await p.click('[data-field="timeline"] .ik-opt >> nth=2');
await p.click('[data-field="contact_preference"] .ik-opt >> nth=2');
await p.fill('[data-field="notes"] textarea', "https://drive.google.com/example");
await p.screenshot({ path: `${OUT}/04-filled-phone.png` });

// answer persistence across refresh
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1100);
const nameVal = await p.locator('[data-field="contact_name"] input').inputValue();
check("answers survive refresh", nameVal === "Felu Dama", `got "${nameVal}"`);
const restoredBanner = await p.locator(".ik-restored").count();
check("restored banner shows", restoredBanner === 1);
await p.screenshot({ path: `${OUT}/05-restored-phone.png` });

// honeypot must not be visible
const hpBox = await p.locator("#company_website").boundingBox();
check("honeypot is off-screen", !hpBox || hpBox.x < 0, JSON.stringify(hpBox));

/* -------------------------------------------------------------- DESKTOP */
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const d = await desk.newPage();
await d.goto(`${BASE}/intake`, { waitUntil: "networkidle" });
await d.waitForTimeout(900);
await d.screenshot({ path: `${OUT}/06-form-desktop.png`, fullPage: true });
check("desktop form is a single page", await d.locator('[data-field="contact_name"]').isVisible());
check("desktop submit is on the form", await d.locator(".ik-foot .ik-btn-solid").isVisible());

// admin gate
await d.goto(`${BASE}/admin/intakes`, { waitUntil: "networkidle" });
await d.waitForTimeout(600);
check("admin redirects anonymous users to login", d.url().includes("/admin/login"), d.url());
await d.screenshot({ path: `${OUT}/07-admin-login.png` });

// landing page: one Start a project CTA, no Book a call / WhatsApp
await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
await d.waitForTimeout(2000);
const heroText = await d.locator("h1").first().innerText();
check("landing page still renders", heroText.toLowerCase().includes("growth"), heroText.replace(/\n/g, " "));
const startLinks = await d.locator('a[href="/intake"]').count();
check("Start a project points at /intake", startLinks >= 1, `${startLinks} /intake links`);
const bookCall = await d.getByText("Book a call").count();
const whatsapp = await d.locator('a[href*="wa.me"]').count();
check("Book a call CTA is gone", bookCall === 0);
check("WhatsApp CTA is gone", whatsapp === 0);
const phoneLink = await d.locator('a[href="tel:+18329295126"]').count();
check("phone number remains as contact info", phoneLink >= 1);
const emailLink = await d.locator('a[href^="mailto:"]').count();
check("email is contact info, not a Book a call CTA", emailLink >= 1 && bookCall === 0);
await d.screenshot({ path: `${OUT}/08-landing-desktop.png` });

await browser.close();

console.log(`\n${fails.length === 0 ? "ALL CHECKS PASSED" : `${fails.length} FAILED: ${fails.join(", ")}`}`);
process.exit(fails.length === 0 ? 0 : 1);
