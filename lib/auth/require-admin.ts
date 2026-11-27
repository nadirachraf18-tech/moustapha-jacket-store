import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Non autorisé" }, { status: 401 }) };
  }
  return { session, response: null };
}
