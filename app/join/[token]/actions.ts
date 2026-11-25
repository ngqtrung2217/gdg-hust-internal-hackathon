"use server";

import { signIn } from "@/auth";

export async function signInAndJoinAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");

  if (!/^[0-9a-f]{64}$/i.test(token)) {
    return;
  }

  await signIn("google", { redirectTo: `/join/${token}` });
}
