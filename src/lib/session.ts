import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifySessionToken } from "./security";

/**
 * Guard for admin server components. Every protected page calls this before
 * touching the database, so an unauthenticated request never reaches a query.
 */
export async function requireAdmin(returnTo: string): Promise<void> {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(ADMIN_COOKIE)?.value)) {
    redirect(`/admin/login?next=${encodeURIComponent(returnTo)}`);
  }
}
