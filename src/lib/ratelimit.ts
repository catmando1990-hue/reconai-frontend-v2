/**
 * Rate Limiting - ReconAI API Protection
 *
 * Uses Upstash Redis for distributed rate limiting.
 * Falls back to allowing requests if Redis is unavailable (fail-open).
 *
 * Environment variables required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const isConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

// Create Redis client only if configured
const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limit configurations
export const rateLimiters = {
  // Standard API: 100 requests per minute
  standard: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "ratelimit:standard",
      })
    : null,

  // Auth endpoints: 10 requests per minute
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:auth",
      })
    : null,

  // Plaid operations: 20 requests per minute
  plaid: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        analytics: true,
        prefix: "ratelimit:plaid",
      })
    : null,

  // AI/Intelligence: 10 requests per minute
  intelligence: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "ratelimit:intelligence",
      })
    : null,

  // Exports: 5 requests per minute
  exports: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "ratelimit:exports",
      })
    : null,
};

export type RateLimitType = keyof typeof rateLimiters;

/**
 * Check rate limit for a given identifier and type.
 * Returns { success: true } if allowed, { success: false, reset: number } if blocked.
 * If Redis is not configured, always returns success (fail-open).
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "standard",
): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}> {
  const limiter = rateLimiters[type];

  if (!limiter) {
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error, failing open:", error);
    return { success: true };
  }
}

/**
 * Helper to extract identifier from request.
 * Uses user ID if authenticated, falls back to IP.
 */
export function getRateLimitIdentifier(
  userId: string | null,
  request: Request,
): string {
  if (userId) {
    return `user:${userId}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
}
