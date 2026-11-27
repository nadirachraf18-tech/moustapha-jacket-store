"use server";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
export async function signOut() {
  await auth.signOut({ headers: await (await import("next/headers")).headers() });
  redirect("/admin/login");
}
