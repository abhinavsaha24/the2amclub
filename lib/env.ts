import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "Must provide Supabase ANON KEY"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "Must provide Supabase Service Role Key"),
  CRON_SECRET: z.string().min(8, "Must provide Cron Secret").optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:\n", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
