import type { Metadata } from "next";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import AdminList from "./AdminList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Intakes — Nebula Digital",
  robots: { index: false, follow: false },
};

export default async function IntakesPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string }>;
}) {
  await requireAdmin("/admin/intakes");
  const { open } = await searchParams;

  const db = sql();
  const rows = (await db`
    select * from client_intakes order by created_at desc limit 500
  `) as Record<string, unknown>[];

  return <AdminList rows={rows} openId={open ?? null} />;
}
