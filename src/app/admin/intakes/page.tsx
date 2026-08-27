import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import SignOutButton from "./SignOutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intakes — Nebula Digital",
  robots: { index: false, follow: false },
};

export default async function IntakesPage() {
  await requireAdmin("/admin/intakes");

  const inbox = process.env.NOTIFY_EMAIL ?? "nebuladigitalceo@gmail.com";

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
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="ad-wrap">
        <h1 className="ad-h">Submissions go to email</h1>
        <p className="ad-meta">
          There is no in-app dashboard. Every completed intake is emailed to{" "}
          <strong>{inbox}</strong>. Check that inbox (and spam) for new
          submissions — you can reply directly to the client from the message.
        </p>
        <p className="ad-meta">
          Rate limiting is in memory on this server and resets when the process
          restarts.
        </p>
      </div>
    </div>
  );
}
