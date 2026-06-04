import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginGoogle from "@/components/shared/LoginGoogle";

describe("LoginGoogle", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      href: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the 'Continue with Google' button", () => {
    render(<LoginGoogle />);
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeInTheDocument();
  });

  it("renders the Google icon SVG", () => {
    const { container } = render(<LoginGoogle />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("navigates to google login URL when clicked", async () => {
    const user = userEvent.setup();
    render(<LoginGoogle />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });
    await user.click(button);

    expect(window.location.href).toBe(
      "http://localhost:8000/api/auth/google/login",
    );
  });

  it("has type='button' to prevent accidental form submission", () => {
    render(<LoginGoogle />);
    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(button).toHaveAttribute("type", "button");
  });
});
