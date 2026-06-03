import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PromptrLogo } from "@/components/PromptrLogo";

describe("PromptrLogo", () => {
  it("renders the Promptr wordmark by default", () => {
    const { container } = render(<PromptrLogo />);

    expect(screen.getByText("Promptr")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("can render only the mark for compact placements", () => {
    render(<PromptrLogo showWordmark={false} />);

    expect(screen.queryByText("Promptr")).not.toBeInTheDocument();
  });
});
