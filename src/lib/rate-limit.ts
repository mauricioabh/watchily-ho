import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let searchLimiter: Ratelimit | null | undefined;

function getSearchLimiter(): Ratelimit | null {
  if (searchLimiter !== undefined) {
    return searchLimiter;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) {
    searchLimiter = null;
    return null;
  }
  const redis = new Redis({ url, token });
  searchLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "watchily:search",
  });
  return searchLimiter;
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSec: number };

/** Per-user sliding window on title search (Watchmode-heavy). */
export async function rateLimitTitleSearch(
  userId: string,
): Promise<RateLimitResult> {
  const limiter = getSearchLimiter();
  if (!limiter) {
    return { limited: false };
  }
  const { success, reset } = await limiter.limit(userId);
  if (success) {
    return { limited: false };
  }
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { limited: true, retryAfterSec };
}

export function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}
