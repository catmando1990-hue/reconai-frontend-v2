import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  checkRateLimit,
  getRateLimitIdentifier,
  RateLimitType,
} from "./ratelimit";
import { logger } from "./logger";

interface MiddlewareOptions {
  rateLimitType?: RateLimitType;
  requireAuth?: boolean;
}

interface MiddlewareResult {
  userId: string | null;
  requestId: string;
  response?: NextResponse;
}

/**
 * Standard API middleware that handles:
 * - Request ID generation
 * - Authentication check (optional)
 * - Rate limiting
 *
 * Usage:
 * const { userId, requestId, response } = await apiMiddleware(req, { requireAuth: true, rateLimitType: "plaid" });
 * if (response) return response; // Rate limited or auth failed
 */
export async function apiMiddleware(
  request: Request,
  options: MiddlewareOptions = {},
): Promise<MiddlewareResult> {
  const { rateLimitType = "standard", requireAuth = true } = options;
  const requestId = crypto.randomUUID();

  const { userId } = await auth();

  if (requireAuth && !userId) {
    return {
      userId: null,
      requestId,
      response: NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      ),
    };
  }

  const identifier = getRateLimitIdentifier(userId, request);
  const rateLimit = await checkRateLimit(identifier, rateLimitType);

  if (!rateLimit.success) {
    logger.warn("Rate limit exceeded", {
      request_id: requestId,
      user_id: userId ?? undefined,
      identifier,
      type: rateLimitType,
      reset: rateLimit.reset,
    });

    return {
      userId,
      requestId,
      response: NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retry_after: rateLimit.reset,
          request_id: requestId,
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            "Retry-After": String(Math.ceil((rateLimit.reset ?? 60000) / 1000)),
            "X-RateLimit-Limit": String(rateLimit.limit ?? 0),
            "X-RateLimit-Remaining": String(rateLimit.remaining ?? 0),
          },
        },
      ),
    };
  }

  return { userId, requestId };
}
