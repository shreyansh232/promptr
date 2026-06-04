import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LoginGithub from "@/components/shared/LoginGithub";

describe("LoginGithub", () => {
  beforeEach(() => {
    vi.stubGlobal("location", {
      href: "",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the 'Continue with GitHub' button", () => {
    render(<LoginGithub />);
    expect(
      screen.getByRole("button", { name: /continue with github/i }),
    ).toBeInTheDocument();
  });

  it("renders the GitHub icon", () => {
    const { container } = render(<LoginGithub />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("navigates to github login URL when clicked", async () => {
    const user = userEvent.setup();
    render(<LoginGithub />);

    const button = screen.getByRole("button", {
      name: /continue with github/i,
    });
    await user.click(button);

    expect(window.location.href).toBe(
      "http://localhost:8000/api/auth/github/login",
    );
  });

  it("has type='button' to prevent accidental form submission", () => {
    render(<LoginGithub />);
    const button = screen.getByRole("button", {
      name: /continue with github/i,
    });
    expect(button).toHaveAttribute("type", "button");
  });
});
