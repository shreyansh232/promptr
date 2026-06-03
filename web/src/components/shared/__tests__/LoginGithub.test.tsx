import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LoginGithub from "@/components/shared/LoginGithub";

const mockLogin = vi.fn();

vi.mock("@/actions/auth", () => ({
  login: (...args: unknown[]) => mockLogin(...args) as Promise<void>,
}));

describe("LoginGithub", () => {
  beforeEach(() => {
    mockLogin.mockClear();
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

  it("calls login('github') when clicked", async () => {
    const user = userEvent.setup();
    render(<LoginGithub />);

    const button = screen.getByRole("button", {
      name: /continue with github/i,
    });
    await user.click(button);

    expect(mockLogin).toHaveBeenCalledOnce();
    expect(mockLogin).toHaveBeenCalledWith("github");
  });

  it("has type='button' to prevent accidental form submission", () => {
    render(<LoginGithub />);
    const button = screen.getByRole("button", {
      name: /continue with github/i,
    });
    expect(button).toHaveAttribute("type", "button");
  });
});
