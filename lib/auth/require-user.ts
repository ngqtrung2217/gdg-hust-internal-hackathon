import "server-only";
import { redirect } from "next/navigation";
import { getSessionContext } from "./session";

export async function requireUser() {
  const context = await getSessionContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}
