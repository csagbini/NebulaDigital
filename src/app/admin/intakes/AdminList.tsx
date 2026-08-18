"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fieldByKey, optionLabel, statuses } from "@/lib/strings";
import { buildSummary, headline } from "@/lib/summary";

type Row = Record<string, unknown>;
type Filter = "all" | "new" | "reviewed" | "quoted";

function label(key: string, value: unknown): string {
  const f = fieldByKey(key);
  const v = typeof value === "string" ? value : "";
  if (!v) return "—";
  return f ? optionLabel(f, v, "en") : v;
}

function when(iso: unknown): string {
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminList({
  rows: initialRows,
  openId,
}: {
  rows: Row[];
  openId: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<string | null>(openId);

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, reviewed: 0, quoted: 0 };
    for (const r of rows) {
      const s = String(r.status) as Exclude<Filter, "all">;
      if (s in c) c[s] += 1;
    }
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  // A row linked from the notification email should be open on arrival.
  useEffect(() => {
    if (openId) {
      document
        .getElementById(`row-${openId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [openId]);

  function patch(id: string, changes: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    );
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  return (
    <div className="ad">
      <header className="ad-top">
        <div className="ad-top-in">
          <div className="ad-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ad-logo" src="/brand.png" alt="Nebula Digital" />
            <span>Client intakes</span>
          </div>
          <div className="ad-actions">
            <button className="ad-btn" onClick={logout} type="button">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="ad-wrap">
        <h1 className="ad-h">Submissions</h1>
        <p className="ad-meta">
          {counts.all} total
          {counts.new > 0 && ` · ${counts.new} awaiting review`}
        </p>

        <div className="ad-filters">
          {(["all", "new", "reviewed", "quoted"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`ad-chip${filter === f ? " on" : ""}`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f === "all" ? "All" : statuses.find((s) => s.value === f)?.en}
              <span style={{ opacity: 0.55, marginLeft: 7 }}>{counts[f]}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="ad-empty">
            {rows.length === 0
              ? "No submissions yet. Send a client the link to /intake."
              : "Nothing with that status."}
          </div>
        ) : (
          <div className="ad-list">
            {visible.map((row) => {
              const id = String(row.id);
              const isOpen = open === id;
              const h = headline(row);
              return (
                <div
                  className={`ad-row${isOpen ? " open" : ""}`}
                  key={id}
                  id={`row-${id}`}
                >
                  <div
                    className="ad-row-head"
                    onClick={() => setOpen(isOpen ? null : id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpen(isOpen ? null : id);
                      }
                    }}
                  >
                    <div>
                      <div className="ad-biz">{h.business}</div>
                      <div className="ad-who">
                        {h.contact}
                        {h.email ? ` · ${h.email}` : ""}
                      </div>
                    </div>
                    <div className="ad-cell">{label("primary_goal", h.goal)}</div>
                    <div className="ad-cell">
                      {label("budget_range", h.budget)}
                    </div>
                    <div className="ad-when">{when(row.created_at)}</div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                      }}
                    >
                      <span className={`ad-pill ${row.status}`}>
                        {statuses.find((s) => s.value === row.status)?.en ??
                          String(row.status)}
                      </span>
                      <svg
                        className="ad-caret"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {isOpen && (
                    <Detail row={row} onPatch={(c) => patch(id, c)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ======================================================================= */

function Detail({
  row,
  onPatch,
}: {
  row: Row;
  onPatch: (changes: Partial<Row>) => void;
}) {
  const id = String(row.id);
  const lang = row.lang === "es" ? "es" : "en";
  const summary = useMemo(() => buildSummary(row, "en", true), [row]);
  const files = Array.isArray(row.files)
    ? (row.files as { name: string; url: string; size: number }[])
    : [];

  const [notes, setNotes] = useState(String(row.internal_notes ?? ""));
  const [saved, setSaved] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(changes: { status?: string; internal_notes?: string }) {
    const res = await fetch("/api/admin/intake", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...changes }),
    });
    if (res.ok) {
      onPatch(changes as Partial<Row>);
      setSaved("Saved");
      setTimeout(() => setSaved(""), 1800);
    } else {
      setSaved("Save failed");
    }
  }

  // Debounced so we're not writing on every keystroke.
  function onNotes(v: string) {
    setNotes(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save({ internal_notes: v }), 800);
  }

  return (
    <div className="ad-body">
      <div className="ad-tools">
        <div className="ad-tool" style={{ maxWidth: 300 }}>
          <label>Status</label>
          <div className="ad-status-set">
            {statuses.map((s) => (
              <button
                key={s.value}
                className={`ad-chip${row.status === s.value ? " on" : ""}`}
                onClick={() => save({ status: s.value })}
                type="button"
              >
                {s.en}
              </button>
            ))}
          </div>
        </div>

        <div className="ad-tool">
          <label>Internal notes — never shown to the client</label>
          <textarea
            className="ad-notes"
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder="Scope thoughts, red flags, what to quote…"
          />
          <div className="ad-saved">{saved}</div>
        </div>

        <div className="ad-tool" style={{ maxWidth: 190, minWidth: 170 }}>
          <label>Proposal</label>
          <a
            className="ad-btn ad-btn-solid"
            href={`/admin/intakes/${id}/print`}
            target="_blank"
            rel="noreferrer"
          >
            Printable summary
          </a>
          <div
            style={{
              marginTop: 10,
              fontSize: "0.74rem",
              color: "var(--faint)",
            }}
          >
            Submitted in {lang === "es" ? "Spanish" : "English"}
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="ad-sec">
          <h4>Files ({files.length})</h4>
          <div className="ad-files">
            {files.map((f) => (
              <a
                className="ad-file"
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noreferrer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="1.7">
                  <path d="M14 3v5h5M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z" />
                </svg>
                {f.name}
                <span className="sz">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {summary.map((sec) => (
        <div className="ad-sec" key={sec.id}>
          <h4>{sec.title}</h4>
          <dl>
            {sec.items.map((it) => (
              <div className="ad-qa" key={it.key}>
                <dt>{it.question}</dt>
                <dd className={it.empty ? "none" : undefined}>{it.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
