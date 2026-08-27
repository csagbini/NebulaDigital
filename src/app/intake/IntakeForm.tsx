"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Field,
  type Lang,
  type UiStrings,
  sections,
  ui,
} from "@/lib/strings";
import {
  type Errors,
  type Values,
  validateSection,
  visibleFields,
} from "@/lib/validate";
import { HONEYPOT_FIELD } from "@/lib/security.client";

const STORAGE_KEY = "nebula_intake_v1";
const LANG_KEY = "nebula_lang";

interface Saved {
  values: Values;
  step: number;
  startedAt: number;
}

function emptyValues(): Values {
  const v: Values = {};
  for (const s of sections) {
    for (const f of s.fields) {
      v[f.key] = f.type === "checkbox" ? [] : "";
    }
  }
  return v;
}

export default function IntakeForm() {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState(-1); // -1 intro · 0..n-1 sections · n done
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [restored, setRestored] = useState(false);
  const [goingBack, setGoingBack] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const startedAt = useRef<number>(Date.now());
  const honeypot = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const t = ui[lang];
  const total = sections.length;
  const done = step >= total;

  /* ---------------------------------------------------------- restore */

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === "en" || savedLang === "es") setLang(savedLang);

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        if (parsed?.values) {
          setValues({ ...emptyValues(), ...parsed.values });
          startedAt.current = parsed.startedAt || Date.now();
          const hasAnswers = Object.values(parsed.values).some((v) =>
            Array.isArray(v) ? v.length > 0 : Boolean(v),
          );
          if (hasAnswers) {
            setRestored(true);
            setStep(Math.min(Math.max(parsed.step ?? 0, 0), total - 1));
          }
        }
      }
    } catch {
      /* corrupted storage shouldn't break the form */
    }
    setHydrated(true);
  }, [total]);

  /* ------------------------------------------------------------- save */

  useEffect(() => {
    if (!hydrated || done) return;
    try {
      const payload: Saved = { values, step, startedAt: startedAt.current };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* private mode / quota — form still works, just won't resume */
    }
  }, [values, step, hydrated, done]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang, hydrated]);

  /* ------------------------------------------------------------ helpers */

  const setValue = useCallback((key: string, v: string | string[]) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const toggleCheckbox = useCallback((key: string, option: string) => {
    setValues((prev) => {
      const cur = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      return {
        ...prev,
        [key]: cur.includes(option)
          ? cur.filter((v) => v !== option)
          : [...cur, option],
      };
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setGoingBack(true);
    setFormError("");
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }

  async function goNext() {
    setGoingBack(false);
    const section = sections[step];
    const found = validateSection(section, values, lang);

    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFormError(t.errFixAbove);
      // Focus the first thing that's wrong so phone users aren't hunting.
      const firstKey = visibleFields(section.fields, values).find(
        (f) => found[f.key],
      )?.key;
      if (firstKey) {
        document
          .querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErrors({});
    setFormError("");

    if (step < total - 1) {
      setStep(step + 1);
      scrollTop();
    } else {
      await submit();
    }
  }

  /* ------------------------------------------------------------ submit */

  async function submit() {
    setBusy(true);
    setFormError("");

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          lang,
          started_at: startedAt.current,
          [HONEYPOT_FIELD]: honeypot.current?.value ?? "",
        }),
      });

      if (res.status === 429) {
        setFormError(t.errRateLimit);
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          errors?: Errors;
        };
        if (body.errors && Object.keys(body.errors).length > 0) {
          // The server rejected something the client let through — jump the
          // user back to the section that actually contains the problem.
          setErrors(body.errors);
          const badKey = Object.keys(body.errors)[0];
          const idx = sections.findIndex((s) =>
            s.fields.some((f) => f.key === badKey),
          );
          if (idx >= 0) setStep(idx);
          setFormError(t.errFixAbove);
        } else {
          setFormError(t.errSubmit);
        }
        setBusy(false);
        return;
      }

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setStep(total);
      scrollTop();
    } catch {
      setFormError(t.errSubmit);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setValues(emptyValues());
    setErrors({});
    setRestored(false);
    startedAt.current = Date.now();
    setStep(-1);
  }

  /* ------------------------------------------------------------ render */

  const LangToggle = (
    <button
      className="ik-lang"
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      aria-label={lang === "en" ? "Cambiar a español" : "Switch to English"}
      type="button"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18" />
      </svg>
      {lang === "en" ? "ES" : "EN"}
    </button>
  );

  // Avoid a flash of English before localStorage is read.
  if (!hydrated) {
    return <div className="ik" aria-busy="true" />;
  }

  /* ------ intro ------ */
  if (step === -1) {
    return (
      <div className="ik">
        <div className="ik-glow" />
        <div className="ik-top">
          <div className="ik-top-in">
            <div className="ik-bar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ik-logo" src="/brand.png" alt={t.brandAlt} />
              {LangToggle}
            </div>
          </div>
        </div>
        <div className="ik-centre">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ik-herologo" src="/brand.png" alt={t.brandAlt} />
          <span className="ik-label">{t.kicker}</span>
          <h1 className="ik-title">{t.introTitle}</h1>
          <p>{t.introBody}</p>
          <div style={{ marginTop: 40 }}>
            <button
              className="ik-btn ik-btn-solid"
              onClick={() => setStep(0)}
              type="button"
              style={{ flex: "none", padding: "16px 44px" }}
            >
              {t.introStart}
            </button>
          </div>
          <div className="meta">{t.introMeta}</div>
        </div>
      </div>
    );
  }

  /* ------ thank you ------ */
  if (done) {
    return (
      <div className="ik">
        <div className="ik-glow" />
        <div className="ik-top">
          <div className="ik-top-in">
            <div className="ik-bar">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ik-logo" src="/brand.png" alt={t.brandAlt} />
              {LangToggle}
            </div>
          </div>
        </div>
        <div className="ik-centre">
          <div className="ik-tick">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="1.8">
              <path d="M4 12.5l5.5 5.5L20 7" />
            </svg>
          </div>
          <h1 className="ik-title">{t.thanksTitle}</h1>
          <p>{t.thanksBody}</p>
          <div style={{ marginTop: 38 }}>
            <a className="ik-btn" href="https://nebuladigital.io">
              {t.thanksBack}
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ------ a section ------ */
  const section = sections[step];
  const shown = visibleFields(section.fields, values);
  const pct = ((step + 1) / total) * 100;

  return (
    <div className="ik">
      <div className="ik-glow" />
      <div ref={topRef} />

      <header className="ik-top">
        <div className="ik-top-in">
          <div className="ik-bar">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ik-logo" src="/brand.png" alt={t.brandAlt} />
            {LangToggle}
          </div>
          <div className="ik-prog">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="ik-steps">
            <span>
              {t.step} <b>{step + 1}</b> {t.of} <b>{total}</b>
            </span>
            <span>{section.title[lang]}</span>
          </div>
        </div>
      </header>

      <main className="ik-main">
        <div className={`ik-screen${goingBack ? " back" : ""}`} key={section.id}>
          {restored && step === 0 && (
            <div className="ik-restored">
              <span>{t.restored}</span>
              <button type="button" onClick={startOver}>
                {t.restartLink}
              </button>
            </div>
          )}

          <span className="ik-label">{section.title[lang]}</span>
          <h1 className="ik-title">{section.subtitle[lang]}</h1>
          <div className="ik-sub" />

          {shown.map((field) => (
            <FieldView
              key={field.key}
              field={field}
              lang={lang}
              value={values[field.key]}
              error={errors[field.key]}
              onChange={setValue}
              onToggle={toggleCheckbox}
              t={t}
            />
          ))}

          {/* Honeypot: invisible to people, irresistible to bots. */}
          <div className="ik-hp" aria-hidden="true">
            <label htmlFor={HONEYPOT_FIELD}>Company website</label>
            <input
              ref={honeypot}
              id={HONEYPOT_FIELD}
              name={HONEYPOT_FIELD}
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
        </div>
      </main>

      <footer className="ik-foot">
        {formError && <div className="ik-formerr">{formError}</div>}
        <div className="ik-foot-in">
          {step > 0 && (
            <button
              className="ik-btn"
              onClick={goBack}
              disabled={busy}
              type="button"
            >
              {t.back}
            </button>
          )}
          <button
            className="ik-btn ik-btn-solid"
            onClick={goNext}
            disabled={busy}
            type="button"
          >
            {busy
              ? t.submitting
              : step === total - 1
                ? t.submit
                : t.next}
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ========================================================================
 * A single question
 * ===================================================================== */

function FieldView({
  field,
  lang,
  value,
  error,
  onChange,
  onToggle,
  t,
}: {
  field: Field;
  lang: Lang;
  value: string | string[];
  error?: string;
  onChange: (key: string, v: string) => void;
  onToggle: (key: string, option: string) => void;
  t: UiStrings;
}) {
  const str = typeof value === "string" ? value : "";
  const arr = Array.isArray(value) ? value : [];
  const many = (field.options?.length ?? 0) > 6;

  return (
    <div className={`ik-field${error ? " bad" : ""}`} data-field={field.key}>
      <label className="ik-q" htmlFor={field.key}>
        {field.label[lang]}
        {!field.required && (
          <span className="ik-opt-tag">{t.optional}</span>
        )}
      </label>

      {field.help && <p className="ik-help">{field.help[lang]}</p>}
      {field.type === "checkbox" && (
        <p className="ik-help" style={{ marginTop: -10 }}>
          {t.selectAll}
        </p>
      )}

      {/* --- text-ish --- */}
      {["text", "email", "tel", "url"].includes(field.type) && (
        <input
          id={field.key}
          className="ik-input"
          type={field.type === "url" ? "text" : field.type}
          inputMode={
            field.type === "tel"
              ? "tel"
              : field.type === "email"
                ? "email"
                : field.type === "url"
                  ? "url"
                  : undefined
          }
          autoComplete={
            field.key === "contact_name"
              ? "name"
              : field.key === "email"
                ? "email"
                : field.key === "phone"
                  ? "tel"
                  : field.key === "business_name"
                    ? "organization"
                    : "off"
          }
          value={str}
          maxLength={field.maxLength}
          placeholder={field.placeholder?.[lang]}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-invalid={Boolean(error)}
        />
      )}

      {field.type === "textarea" && (
        <textarea
          id={field.key}
          className="ik-textarea"
          value={str}
          maxLength={field.maxLength}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-invalid={Boolean(error)}
        />
      )}

      {field.type === "select" && (
        <select
          id={field.key}
          className="ik-select"
          value={str}
          onChange={(e) => onChange(field.key, e.target.value)}
          aria-invalid={Boolean(error)}
        >
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o[lang]}
            </option>
          ))}
        </select>
      )}

      {field.type === "radio" && (
        <div className={`ik-opts${many ? " grid" : ""}`}>
          {field.options?.map((o) => (
            <label
              key={o.value}
              className={`ik-opt${str === o.value ? " on" : ""}`}
            >
              <input
                type="radio"
                name={field.key}
                value={o.value}
                checked={str === o.value}
                onChange={() => onChange(field.key, o.value)}
              />
              <span className="ik-mark round">
                <i />
              </span>
              {o[lang]}
            </label>
          ))}
        </div>
      )}

      {field.type === "checkbox" && (
        <div className={`ik-opts${many ? " grid" : ""}`}>
          {field.options?.map((o) => (
            <label
              key={o.value}
              className={`ik-opt${arr.includes(o.value) ? " on" : ""}`}
            >
              <input
                type="checkbox"
                name={field.key}
                value={o.value}
                checked={arr.includes(o.value)}
                onChange={() => onToggle(field.key, o.value)}
              />
              <span className="ik-mark square">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#050506" strokeWidth="3.4">
                  <path d="M4 12.5l5.5 5.5L20 7" />
                </svg>
              </span>
              {o[lang]}
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className="ik-err">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6M12 16.5v.5" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
