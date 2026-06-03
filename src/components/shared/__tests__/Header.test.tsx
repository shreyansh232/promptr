import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/shared/Header";

vi.mock("auth", () => ({
  auth: vi.fn(async () => null),
}));

vi.mock("@/components/shared/UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu" />,
}));

describe("Header", () => {
  it("shows landing navigation and unauthenticated actions", async () => {
    render(await Header());

    expect(screen.getByRole("link", { name: /promptr home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: /features/i })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(screen.getByRole("link", { name: /workflow/i })).toHaveAttribute(
      "href",
      "/#workflow",
    );
    expect(screen.getByRole("link", { name: /missions/i })).toHaveAttribute(
      "href",
      "/missions",
    );
    expect(screen.getByRole("link", { name: /lab/i })).toHaveAttribute(
      "href",
      "/lab",
    );
    expect(
      screen.getByRole("link", { name: /star on github/i }),
    ).toHaveAttribute("href", "https://github.com/shreyansh232/promptr");
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });
});
