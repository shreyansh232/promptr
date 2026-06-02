import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows the first request for a new key", () => {
    const result = checkRateLimit("test-key-1", 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("decrements remaining with each request", () => {
    const key = "test-key-decrement";
    const r1 = checkRateLimit(key, 3, 60000);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit(key, 3, 60000);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, 3, 60000);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests after limit is reached", () => {
    const key = "test-key-block";
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);

    const result = checkRateLimit(key, 2, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after the window expires", () => {
    const key = "test-key-reset";
    checkRateLimit(key, 1, 1000);
    const blocked = checkRateLimit(key, 1, 1000);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    const afterReset = checkRateLimit(key, 1, 1000);
    expect(afterReset.allowed).toBe(true);
  });

  it("returns a future resetAt when blocked", () => {
    const key = "test-key-resetat";
    checkRateLimit(key, 1, 5000);
    const blocked = checkRateLimit(key, 1, 5000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.resetAt).toBeGreaterThan(Date.now());
  });

  it("returns a future resetAt when allowed", () => {
    const result = checkRateLimit("test-key-allowed-reset", 5, 10000);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it("tracks different keys independently", () => {
    checkRateLimit("key-a", 1, 60000);
    const a2 = checkRateLimit("key-a", 1, 60000);
    expect(a2.allowed).toBe(false);

    const b1 = checkRateLimit("key-b", 1, 60000);
    expect(b1.allowed).toBe(true);
  });

  it("uses sliding window - old requests expire", () => {
    const key = "test-key-sliding";
    checkRateLimit(key, 2, 2000);

    vi.advanceTimersByTime(1000);
    checkRateLimit(key, 2, 2000);

    vi.advanceTimersByTime(1001);

    const result = checkRateLimit(key, 2, 2000);
    expect(result.allowed).toBe(true);
  });
});

describe("RATE_LIMITS", () => {
  it("has elo config", () => {
    expect(RATE_LIMITS.elo).toEqual({ maxRequests: 10, windowMs: 60000 });
  });

  it("has analyzePrompt config", () => {
    expect(RATE_LIMITS.analyzePrompt).toEqual({
      maxRequests: 20,
      windowMs: 60000,
    });
  });

  it("has generateProblems config", () => {
    expect(RATE_LIMITS.generateProblems).toEqual({
      maxRequests: 5,
      windowMs: 60000,
    });
  });

  it("has profile config", () => {
    expect(RATE_LIMITS.profile).toEqual({
      maxRequests: 30,
      windowMs: 60000,
    });
  });
});
