import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProfileForm } from "@/app/profile/ProfileForm";

// Mock next/navigation
const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockGet(key) as string | null,
  }),
}));

const mockInitialData = {
  level: "beginner",
  expertise: "tech",
  application: "coding",
  goals: ["Write clearer prompts"],
  elo: 1000,
  subLevel: 1,
  problemsSolved: 0,
  streak: 0,
  builderRole: "developer",
  frameworks: ["OpenAI Agents SDK"],
  workflowFocus: "coding agents",
  riskFocus: "Tool misuse",
};

describe("ProfileForm Navigation", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("renders back to Missions link by default (no from param)", () => {
    mockGet.mockReturnValue(null);
    render(<ProfileForm initialData={mockInitialData} />);
    const link = screen.getByRole("link", { name: /missions/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/missions");
  });

  it("renders back to Home link if from=landing is specified", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "from") return "landing";
      return null;
    });
    render(<ProfileForm initialData={mockInitialData} />);
    const link = screen.getByRole("link", { name: /home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
