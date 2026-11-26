import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "./require-user";

// cached per request so the admin layout and page share one is_admin call.
export const requireAdmin = cache(async () => {
  const context = await requireUser();
  const { data, error } = await context.supabase.rpc("is_admin");

  if (error || !data) {
    notFound();
  }

  return context;
});
