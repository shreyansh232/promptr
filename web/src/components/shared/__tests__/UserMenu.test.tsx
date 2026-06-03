import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { UserMenu } from "../UserMenu";

vi.mock("@/actions/auth", () => ({
  logout: vi.fn(),
}));

describe("UserMenu", () => {
  it("renders user initials when no image is provided", () => {
    render(<UserMenu name="John Doe" image={null} />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("renders fallback initial 'P' if name and image are missing", () => {
    render(<UserMenu name={null} image={null} />);
    expect(screen.getByText("P")).toBeInTheDocument();
  });

  it("renders avatar image when image is provided", () => {
    render(<UserMenu name="John Doe" image="/test-avatar.png" />);
    const img = screen.getByRole("img", { name: /user image/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });
});
