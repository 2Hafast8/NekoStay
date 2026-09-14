/**
 * In-memory sliding window rate limiter
 * Protects public endpoints from brute-force scanning and abuse.
 */

const rateLimitStore = new Map();

/**
 * Check if client IP is within rate limit.
 * @param {string} ip - IP identifier of client
 * @param {number} [limit=30] - Max requests allowed within window
 * @param {number} [windowMs=60000] - Window period in milliseconds (default 1 minute)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(ip, limit = 30, windowMs = 60 * 1000) {
  const key = ip || "anonymous";
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  rateLimitStore.set(key, record);

  // Periodic cleanup if store exceeds 2000 entries
  if (rateLimitStore.size > 2000) {
    for (const [k, rec] of rateLimitStore.entries()) {
      if (now > rec.resetTime) {
        rateLimitStore.delete(k);
      }
    }
  }

  const allowed = record.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Extract client IP safely from request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

