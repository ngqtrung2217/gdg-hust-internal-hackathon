import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./require-user";

export async function requireAdmin() {
  const context = await requireUser();
  const { data, error } = await context.supabase.rpc("is_admin");

  if (error || !data) {
    notFound();
  }

  return context;
}
