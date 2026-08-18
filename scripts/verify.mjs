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
await p.screenshot({ path: `${OUT}/01-intro-phone.png` });
check("intro renders", await p.locator(".ik-title").isVisible());

// language toggle + persistence
await p.click(".ik-lang");
await p.waitForTimeout(400);
const esTitle = await p.locator(".ik-title").innerText();
check("ES toggle switches copy", esTitle.includes("Cuéntanos"), esTitle);
await p.screenshot({ path: `${OUT}/02-intro-phone-es.png` });

await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(900);
const afterReload = await p.locator(".ik-title").innerText();
check("language survives reload", afterReload.includes("Cuéntanos"), afterReload);

// back to English for the rest
await p.click(".ik-lang");
await p.waitForTimeout(400);

// begin
await p.click(".ik-btn-solid");
await p.waitForTimeout(700);
check("section 1 opens", await p.locator('[data-field="contact_name"]').isVisible());
await p.screenshot({ path: `${OUT}/03-section1-phone.png` });

// validation: continue with nothing filled
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(700);
const errCount = await p.locator(".ik-err").count();
check("empty section blocks continue", errCount > 0, `${errCount} errors shown`);
await p.screenshot({ path: `${OUT}/04-validation-phone.png` });

// bad email specifically
await p.fill('[data-field="email"] input', "not-an-email");
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(500);
const emailErr = await p.locator('[data-field="email"] .ik-err').innerText();
check("invalid email caught", emailErr.toLowerCase().includes("valid"), emailErr);

// fill section 1
await p.fill('[data-field="contact_name"] input', "Felu Dama");
await p.fill('[data-field="business_name"] input', "Test Roofing Co");
await p.fill('[data-field="email"] input', "felu@example.com");
await p.fill('[data-field="phone"] input', "832-929-5126");
await p.fill('[data-field="business_description"] textarea', "Residential roofing and storm repair.");
await p.selectOption('[data-field="years_in_business"] select', "3_10");
await p.fill('[data-field="customer_location"] textarea', "Houston metro");
await p.fill('[data-field="typical_customer"] textarea', "Homeowners aged 35-65");
await p.fill('[data-field="differentiator"] textarea', "Same-week turnaround");

// conditional reveal
const beforeCond = await p.locator('[data-field="website_url"]').count();
await p.click('[data-field="has_website"] .ik-opt >> nth=0');
await p.waitForTimeout(400);
const afterCond = await p.locator('[data-field="website_url"]').count();
check("conditional field reveals on Yes", beforeCond === 0 && afterCond === 1,
  `before=${beforeCond} after=${afterCond}`);
await p.screenshot({ path: `${OUT}/05-conditional-phone.png` });

await p.click('[data-field="has_website"] .ik-opt >> nth=1');
await p.waitForTimeout(400);
check("conditional field hides on No",
  (await p.locator('[data-field="website_url"]').count()) === 0);

await p.click('[data-field="has_website"] .ik-opt >> nth=0');
await p.waitForTimeout(300);
await p.fill('[data-field="website_url"] input', "testroofing.com");
await p.fill('[data-field="website_dislikes"] textarea', "Slow and looks dated.");

// advance
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(800);
const stepText = await p.locator(".ik-steps").innerText();
check("advances to section 2", stepText.includes("2"), stepText.replace(/\n/g, " "));
await p.screenshot({ path: `${OUT}/06-section2-phone.png` });

// progress bar moved
const width = await p.locator(".ik-prog i").evaluate((el) => el.style.width);
check("progress bar advances", width === "33.33333333333333%" || parseFloat(width) > 30, width);

// answer persistence across refresh
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(1100);
const stepAfter = await p.locator(".ik-steps").innerText();
check("step survives refresh", stepAfter.includes("2"), stepAfter.replace(/\n/g, " "));
await p.click(".ik-foot .ik-btn:not(.ik-btn-solid)"); // back
await p.waitForTimeout(700);
const nameVal = await p.locator('[data-field="contact_name"] input').inputValue();
check("answers survive refresh", nameVal === "Felu Dama", `got "${nameVal}"`);
await p.screenshot({ path: `${OUT}/07-restored-phone.png` });

// multi-select section
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(600);
await p.click('[data-field="primary_goal"] .ik-opt >> nth=1');
await p.fill('[data-field="success_metric"] textarea', "10 new roof inquiries a month.");
await p.fill('[data-field="sites_liked"] textarea', "example.com — clean and fast.");
await p.click(".ik-foot .ik-btn-solid");
await p.waitForTimeout(800);
check("reaches section 3", (await p.locator(".ik-steps").innerText()).includes("3"));
await p.click('[data-field="pages_needed"] .ik-opt >> nth=0');
await p.click('[data-field="pages_needed"] .ik-opt >> nth=2');
await p.waitForTimeout(300);
const onCount = await p.locator('[data-field="pages_needed"] .ik-opt.on').count();
check("multi-select takes multiple", onCount === 2, `${onCount} selected`);
await p.screenshot({ path: `${OUT}/08-multiselect-phone.png` });

// honeypot must not be visible
const hpBox = await p.locator("#company_website").boundingBox();
check("honeypot is off-screen", !hpBox || hpBox.x < 0, JSON.stringify(hpBox));

/* -------------------------------------------------------------- DESKTOP */
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const d = await desk.newPage();
await d.goto(`${BASE}/intake`, { waitUntil: "networkidle" });
await d.waitForTimeout(900);
await d.screenshot({ path: `${OUT}/09-intro-desktop.png` });
await d.click(".ik-btn-solid");
await d.waitForTimeout(700);
await d.screenshot({ path: `${OUT}/10-section1-desktop.png`, fullPage: true });

// admin gate
await d.goto(`${BASE}/admin/intakes`, { waitUntil: "networkidle" });
await d.waitForTimeout(600);
check("admin redirects anonymous users to login", d.url().includes("/admin/login"), d.url());
await d.screenshot({ path: `${OUT}/11-admin-login.png` });

// landing page untouched
await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
await d.waitForTimeout(2000);
const heroText = await d.locator("h1").first().innerText();
check("landing page still renders", heroText.toLowerCase().includes("growth"), heroText.replace(/\n/g, " "));
await d.screenshot({ path: `${OUT}/12-landing-desktop.png` });

await browser.close();

console.log(`\n${fails.length === 0 ? "ALL CHECKS PASSED" : `${fails.length} FAILED: ${fails.join(", ")}`}`);
process.exit(fails.length === 0 ? 0 : 1);
