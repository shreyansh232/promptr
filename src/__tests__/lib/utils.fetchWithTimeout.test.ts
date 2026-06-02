import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { fetchWithTimeout } from "@/lib/utils";

/**
 * Helper: re-cast the current `global.fetch` mock with the correct signature.
 * `beforeEach` replaces `global.fetch` with a fresh `vi.fn()`, so a module-
 * level cast would point to a stale mock.
 */
const typedFetch = (): Mock<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
> => global.fetch as unknown as Mock<
  (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
>;

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls fetch with the provided URL and options", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    const result = await fetchWithTimeout("http://example.com", {
      method: "POST",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({ method: "POST", signal: expect.any(AbortSignal) as unknown }),
    );
    expect(result).toBe(mockResponse);
  });

  it("uses default empty options when none provided", async () => {
    const mockResponse = new Response("ok", { status: 200 });
    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    await fetchWithTimeout("http://example.com");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) as unknown }),
    );
  });

  it("aborts the request when timeout is exceeded", async () => {
    const signalCapture: { current: AbortSignal | null } = { current: null };
    typedFetch().mockImplementation((_url, init) => {
      const signal: AbortSignal | null =
        (init?.signal as AbortSignal | undefined) ?? null;
      signalCapture.current = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const promise = fetchWithTimeout("http://example.com", {}, 1000);

    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow("Aborted");
    expect(signalCapture.current?.aborted).toBe(true);
  });

  it("clears the timeout on successful response", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    const mockResponse = new Response("ok", { status: 200 });
    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    await fetchWithTimeout("http://example.com", {}, 5000);

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("clears the timeout on fetch error", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));

    await expect(
      fetchWithTimeout("http://example.com", {}, 5000),
    ).rejects.toThrow("Network error");

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it("uses default timeout of 30000ms", async () => {
    const signalCapture: { current: AbortSignal | null } = { current: null };
    typedFetch().mockImplementation((_url, init) => {
      const signal: AbortSignal | null =
        (init?.signal as AbortSignal | undefined) ?? null;
      signalCapture.current = signal;
      return new Promise((_resolve, reject) => {
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const promise = fetchWithTimeout("http://example.com");

    vi.advanceTimersByTime(29999);
    expect(signalCapture.current?.aborted).toBe(false);

    vi.advanceTimersByTime(1);
    await expect(promise).rejects.toThrow("Aborted");
  });
});
