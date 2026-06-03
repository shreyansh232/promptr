import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import type { AgentProfile } from "@/types/agent-dojo";
import { MissionsWorkspace } from "./MissionsWorkspace";

vi.mock("@/components/shared/UserMenu", () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

const signedInProfile: AgentProfile = {
  id: "user-1",
  level: "beginner",
  expertise: "developer",
  application: "support automation",
  goals: ["Build reliable agents"],
  learningStyle: "kinesthetic",
  subLevel: 2,
  reliabilityScore: 91,
  missionsCompleted: 1,
  streak: 3,
  builderRole: "full-stack developer",
  frameworks: ["OpenAI Agents SDK"],
  workflowFocus: "support automation",
  riskFocus: "Tool misuse",
};

describe("MissionsWorkspace", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the public first mission without authentication", () => {
    render(
      <MissionsWorkspace
        initialMission={PUBLIC_AGENT_MISSION}
        initialProfile={null}
        isAuthenticated={false}
      />,
    );

    expect(screen.getByText(PUBLIC_AGENT_MISSION.title)).toBeInTheDocument();
    expect(screen.getByText("Save progress")).toBeInTheDocument();
  });

  it("shows signed-in reliability progress", () => {
    render(
      <MissionsWorkspace
        initialMission={PUBLIC_AGENT_MISSION}
        initialProfile={signedInProfile}
        isAuthenticated
      />,
    );

    expect(screen.getAllByText("1/25")[0]).toBeInTheDocument();
    expect(screen.getAllByText("3")[0]).toBeInTheDocument();
  });
});
