import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/env", () => ({
  env: { BACKEND_URL: "http://localhost:8000" },
}));

import {
  CREDIT_COSTS,
  DAILY_CREDIT_RESET_LIMIT,
  deductCredits,
  getUserCredits,
} from "@/lib/credits";

describe("CREDIT_COSTS", () => {
  it("has correct ANALYZE_PROMPT cost", () => {
    expect(CREDIT_COSTS.ANALYZE_PROMPT).toBe(1);
  });

  it("has correct EVALUATE_PROMPT cost", () => {
    expect(CREDIT_COSTS.EVALUATE_PROMPT).toBe(2);
  });
});

describe("DAILY_CREDIT_RESET_LIMIT", () => {
  it("equals 50", () => {
    expect(DAILY_CREDIT_RESET_LIMIT).toBe(50);
  });
});

describe("deductCredits", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the correct backend URL with userId and cost", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ allowed: true, remaining: 49 }), {
        status: 200,
      }),
    );

    await deductCredits("user123", 1);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/profiles/user123/deduct?amount=1",
      { method: "POST" },
    );
  });

  it("returns allowed and remaining on success", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ allowed: true, remaining: 48 }), {
        status: 200,
      }),
    );

    const result = await deductCredits("user123", 2);

    expect(result).toEqual({ allowed: true, remaining: 48 });
  });

  it("returns { allowed: false, remaining: 0 } when backend returns non-ok", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response("error", { status: 403 }),
    );

    const result = await deductCredits("user123", 1);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it("returns { allowed: false, remaining: 0 } on network error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const result = await deductCredits("user123", 1);

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });
});

describe("getUserCredits", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the correct backend URL", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ credits: 42 }), { status: 200 }),
    );

    await getUserCredits("user123");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:8000/profiles/user123",
      { cache: "no-store" },
    );
  });

  it("returns credits from the profile response", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ credits: 42 }), { status: 200 }),
    );

    const result = await getUserCredits("user123");

    expect(result).toEqual({ credits: 42 });
  });

  it("returns { credits: 0 } when backend returns non-ok", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response("error", { status: 500 }),
    );

    const result = await getUserCredits("user123");

    expect(result).toEqual({ credits: 0 });
  });

  it("returns { credits: 0 } on network error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    const result = await getUserCredits("user123");

    expect(result).toEqual({ credits: 0 });
  });
});
