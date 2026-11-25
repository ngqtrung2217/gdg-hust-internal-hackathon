import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getServerEnv } from "@/lib/env";
import { profileIdFromGoogleSub } from "@/lib/auth/profile-id";
import { signSupabaseJwt } from "@/lib/auth/supabase-jwt";
import { createSupabaseUserClient } from "@/lib/supabase/user";

type GoogleProfile = {
  sub?: string;
  email?: string | null;
  email_verified?: boolean;
  name?: string | null;
  picture?: string | null;
};

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

if (
  vercelHost &&
  (!process.env.AUTH_URL || /localhost|127\.0\.0\.1/.test(process.env.AUTH_URL))
) {
  process.env.AUTH_URL = `https://${vercelHost}`;
  process.env.NEXTAUTH_URL = `https://${vercelHost}`;
}

const env = getServerEnv();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ profile, account }) {
      const p = profile as GoogleProfile | undefined;

      if (!p?.email || p.email_verified === false) {
        return false;
      }

      const googleSub = account?.providerAccountId ?? p.sub;
      if (!googleSub) {
        return false;
      }

      const accessToken = await signSupabaseJwt({
        sub: profileIdFromGoogleSub(googleSub),
        email: p.email,
        googleSub,
        name: p.name,
        avatarUrl: p.picture,
      });

      const supabase = createSupabaseUserClient(accessToken);
      const { data, error } = await supabase.rpc("finalize_login");

      if (error) {
        return false;
      }

      const result = data as { allowed?: boolean } | null;

      if (!result || result.allowed !== true) {
        return "/login?error=pending";
      }

      return true;
    },
    async jwt({ token, profile, account }) {
      const p = profile as GoogleProfile | undefined;

      if (p && account) {
        const googleSub = account.providerAccountId ?? p.sub;

        if (googleSub) {
          token.googleSub = googleSub;
          token.profileId = profileIdFromGoogleSub(googleSub);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.profileId === "string") {
          session.user.profileId = token.profileId;
        }
        if (typeof token.googleSub === "string") {
          session.user.googleSub = token.googleSub;
        }
      }

      return session;
    },
  },
});
