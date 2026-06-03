import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginGoogle from "@/components/shared/LoginGoogle";

const mockLogin = vi.fn();

vi.mock("@/actions/auth", () => ({
  login: (...args: unknown[]) => mockLogin(...args) as Promise<void>,
}));

describe("LoginGoogle", () => {
  beforeEach(() => {
    mockLogin.mockClear();
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

  it("calls login('google') when clicked", async () => {
    const user = userEvent.setup();
    render(<LoginGoogle />);

    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });
    await user.click(button);

    expect(mockLogin).toHaveBeenCalledOnce();
    expect(mockLogin).toHaveBeenCalledWith("google");
  });

  it("has type='button' to prevent accidental form submission", () => {
    render(<LoginGoogle />);
    const button = screen.getByRole("button", {
      name: /continue with google/i,
    });
    expect(button).toHaveAttribute("type", "button");
  });
});
