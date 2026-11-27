import { auth } from "@/lib/auth/server";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) {
    return { session: null, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT role, banned FROM neon_auth."user" WHERE id = ${session.user.id} LIMIT 1`;
    const user = rows[0];
    if (!user || user.banned === true || !["admin", "superadmin"].includes(String(user.role || "").toLowerCase())) {
      return { session: null, response: NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 }) };
    }
    return { session, response: null };
  } catch {
    return { session: null, response: NextResponse.json({ error: "Vérification des accès impossible" }, { status: 500 }) };
  }
}
