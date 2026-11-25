import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { createSupabaseUserClient } from "@/lib/supabase/user";
import { signSupabaseJwt } from "./supabase-jwt";

export const getSessionContext = cache(async () => {
  const session = await auth();
  const profileId = session?.user?.profileId;
  const email = session?.user?.email;

  if (!session || !profileId || !email) {
    return null;
  }

  const accessToken = await signSupabaseJwt({
    sub: profileId,
    email,
    googleSub: session.user.googleSub,
    name: session.user.name,
    avatarUrl: session.user.image,
  });

  return {
    session,
    profileId,
    email,
    supabase: createSupabaseUserClient(accessToken),
  };
});
