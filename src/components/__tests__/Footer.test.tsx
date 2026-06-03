import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/Footer";

describe("Footer", () => {
  it("renders the logo, stack badges, and grouped landing links", () => {
    render(<Footer />);

    expect(screen.getByText("Promptr")).toBeInTheDocument();
    expect(screen.getByText("MIT licensed")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /features/i })).toHaveAttribute(
      "href",
      "/#features",
    );
    expect(screen.getByRole("link", { name: /lab/i })).toHaveAttribute(
      "href",
      "/lab",
    );
    expect(
      screen.getByRole("link", { name: /create account/i }),
    ).toHaveAttribute("href", "/sign-up");
  });
});
