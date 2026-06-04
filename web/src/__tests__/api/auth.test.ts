import { describe, it, expect, vi } from "vitest";
import { GET } from "../../app/api/auth/[provider]/login/route";

vi.mock("@/env", () => ({
  env: {
    BACKEND_URL: "https://mock-backend-url.com",
  },
}));

describe("Auth Login Redirect API Route", () => {
  it("redirects to Google login endpoint when provider is google", async () => {
    const request = new Request("http://localhost:3000/api/auth/google/login");
    const response = await GET(request, { params: { provider: "google" } });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://mock-backend-url.com/api/auth/google/login",
    );
  });

  it("redirects to GitHub login endpoint when provider is github", async () => {
    const request = new Request("http://localhost:3000/api/auth/github/login");
    const response = await GET(request, { params: { provider: "github" } });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://mock-backend-url.com/api/auth/github/login",
    );
  });

  it("returns 404 for unsupported providers", async () => {
    const request = new Request(
      "http://localhost:3000/api/auth/facebook/login",
    );
    const response = await GET(request, { params: { provider: "facebook" } });

    expect(response.status).toBe(404);
    const body = await response.text();
    expect(body).toBe("Unsupported provider");
  });
});
