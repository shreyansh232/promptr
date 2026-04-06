/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach: tracks request timestamps per key
 * and rejects requests that exceed the limit within the window.
 *
 * NOTE: This is a single-process limiter. For multi-instance deployments,
 * use Redis or another shared store.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup interval: remove expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    // If the oldest timestamp is outside any possible window, remove the entry
    const hasRecent = entry.timestamps.some((ts) => now - ts < 60 * 60 * 1000);
    if (!hasRecent) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

/**
 * Check if a request is within rate limits.
 * @param key - Unique identifier for the rate limit bucket (e.g., user email, IP)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed: boolean; remaining: number; resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

  const remaining = Math.max(0, maxRequests - entry.timestamps.length);

  if (entry.timestamps.length >= maxRequests) {
    // Calculate when the oldest request will expire from the window
    const resetAt = entry.timestamps[0]! + windowMs;
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  entry.timestamps.push(now);

  const resetAt = now + windowMs;
  return { allowed: true, remaining: remaining - 1, resetAt };
}

/**
 * Rate limit configuration for different endpoints.
 */
export const RATE_LIMITS = {
  // ELO updates: 10 per minute (prevents score manipulation)
  elo: { maxRequests: 10, windowMs: 60 * 1000 },
  // Prompt analysis: 20 per minute (prevents API quota burn)
  analyzePrompt: { maxRequests: 20, windowMs: 60 * 1000 },
  // Problem generation: 5 per minute (expensive AI call)
  generateProblems: { maxRequests: 5, windowMs: 60 * 1000 },
  // Profile reads/writes: 30 per minute
  profile: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;
