import "server-only";
import { SignJWT } from "jose";
import { getServerEnv, publicEnv } from "@/lib/env";

type Input = {
  sub: string;
  email: string;
  googleSub?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export async function signSupabaseJwt(input: Input) {
  const { SUPABASE_JWT_SECRET } = getServerEnv();

  return new SignJWT({
    email: input.email,
    role: "authenticated",
    google_sub: input.googleSub ?? undefined,
    user_metadata: {
      full_name: input.name ?? "",
      avatar_url: input.avatarUrl ?? null,
    },
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(input.sub)
    .setAudience("authenticated")
    .setIssuer(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(SUPABASE_JWT_SECRET));
}
