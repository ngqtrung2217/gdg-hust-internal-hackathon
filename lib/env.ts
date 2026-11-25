import "server-only";
import { z } from "zod";

const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const siteUrl = vercelHost
  ? `https://${vercelHost}`
  : process.env.NEXT_PUBLIC_SITE_URL;

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: siteUrl,
});

const serverSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string().min(10),
  AUTH_GOOGLE_SECRET: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(32),
});

let cached: z.infer<typeof serverSchema> | null = null;

export function getServerEnv() {
  if (!cached) {
    cached = serverSchema.parse({
      AUTH_SECRET: process.env.AUTH_SECRET,
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
    });
  }
  return cached;
}
