import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const optionalString = z.string().trim().min(1).optional();
const optionalUrl = z.string().url().optional();

/**
 * Runtime configuration shared by server modules and explicitly public client
 * modules. Server-only values are never included in the client runtime map.
 */
export const env = createEnv({
  server: {
    SUPABASE_SECRET_KEY: optionalString,
    WATCHMODE_API_KEY: z.string().trim().min(1),
    MOVIEOFTHENIGHT_API_KEY: optionalString,
    STREAMING_AVAILABILITY_API_KEY: optionalString,
    RAPIDAPI_KEY: optionalString,
    AVAILABILITY_SA_FOR_UNSUPPORTED_REGIONS: z
      .enum(["0", "1", "true", "false", "on", "off"])
      .default("1"),
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    INNGEST_EVENT_KEY: optionalString,
    INNGEST_SIGNING_KEY: optionalString,
    VAPID_PUBLIC_KEY: optionalString,
    VAPID_PRIVATE_KEY: optionalString,
    VAPID_SUBJECT: optionalString,
    SENTRY_DSN: optionalUrl,
    SENTRY_ORG: optionalString,
    SENTRY_PROJECT: optionalString,
    VERCEL_URL: optionalString,
    VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
    VERCEL_GIT_COMMIT_REF: optionalString,
    OMNI_ALLOW_PREVIEW_INDEX: z.enum(["true", "false"]).optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
    NEXT_PUBLIC_SITE_URL: optionalUrl,
    NEXT_PUBLIC_APP_URL: optionalUrl,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: optionalString,
    NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
  },
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  },
});

export function isConfiguredPair(
  first: string | undefined,
  second: string | undefined,
): boolean {
  return Boolean(first && second);
}
