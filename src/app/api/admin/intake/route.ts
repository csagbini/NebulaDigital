import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/security";
import { statuses } from "@/lib/strings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(statuses.map((s) => s.value as string));

/** Update a submission's status or internal notes. Admin session required. */
export async function PATCH(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    internal_notes?: string;
  };

  if (!body.id || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const db = sql();

    if (body.status !== undefined) {
      if (!VALID.has(body.status)) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      await db`update client_intakes set status = ${body.status} where id = ${body.id}::uuid`;
    }

    if (body.internal_notes !== undefined) {
      const notes = String(body.internal_notes).slice(0, 20000);
      await db`update client_intakes set internal_notes = ${notes} where id = ${body.id}::uuid`;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] Update failed:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
