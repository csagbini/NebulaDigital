import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { buildSummary, headline } from "@/lib/summary";
import PrintBar from "./PrintBar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intake summary — Nebula Digital",
  robots: { index: false, follow: false },
};

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/intakes/${id}/print`);

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = sql();
  const rows = (await db`
    select * from client_intakes where id = ${id}::uuid limit 1
  `) as Record<string, unknown>[];

  const row = rows[0];
  if (!row) notFound();

  const h = headline(row);
  // Hide unanswered optional questions — this goes out attached to a proposal,
  // and a column of em-dashes reads as an incomplete brief.
  const summary = buildSummary(row, "en", false);
  const files = Array.isArray(row.files)
    ? (row.files as { name: string; size: number }[])
    : [];

  const submitted = new Date(String(row.created_at)).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="pr">
      <PrintBar backHref="/admin/intakes" />

      <div className="pr-wrap">
        <header className="pr-head">
          <div>
            <h1>{h.business}</h1>
            <div className="sub">
              {[h.contact, h.email, h.phone].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="id">
            Client intake
            <br />
            {submitted}
            <br />
            {String(row.id).slice(0, 8)}
          </div>
        </header>

        {summary.map((sec) => (
          <section className="pr-sec" key={sec.id}>
            <h2>{sec.title}</h2>
            <dl>
              {sec.items.map((it) => (
                <div className="pr-qa" key={it.key}>
                  <dt>{it.question}</dt>
                  <dd>{it.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {files.length > 0 && (
          <section className="pr-sec">
            <h2>Attached files</h2>
            <dl>
              {files.map((f) => (
                <div className="pr-qa" key={f.name}>
                  <dt>{f.name}</dt>
                  <dd>{(f.size / 1024 / 1024).toFixed(2)} MB</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <footer className="pr-foot">
          <span>
            Nebula Digital · Houston, TX · nebuladigital.io
          </span>
          <span>
            Submitted in {row.lang === "es" ? "Spanish" : "English"}
          </span>
        </footer>
      </div>
    </div>
  );
}
