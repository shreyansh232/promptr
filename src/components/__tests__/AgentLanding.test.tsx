import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentLanding } from "@/components/AgentLanding";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";

describe("AgentLanding", () => {
  it("renders the complete landing page sections and primary actions", () => {
    render(<AgentLanding />);

    expect(
      screen.getByText("prompt engineering & evaluation platform"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /stress-test prompts for ai agents/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /try lab/i })).toHaveAttribute(
      "href",
      "/lab",
    );
    expect(screen.getByRole("link", { name: /try missions/i })).toHaveAttribute(
      "href",
      "/missions",
    );
    expect(
      screen.getByRole("heading", {
        name: /a deliberate loop for getting better at prompting/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /everything you need to ship reliable ai agents/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: PUBLIC_AGENT_MISSION.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tool policy to learn")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /answers to the questions we actually get asked/i,
      }),
    ).toBeInTheDocument();
  });

  it("links the key Promptr pages from the practice path cards", () => {
    render(<AgentLanding />);

    expect(
      screen.getByRole("link", { name: /open missions/i }),
    ).toHaveAttribute("href", "/missions");
    expect(screen.getByRole("link", { name: /go to lab/i })).toHaveAttribute(
      "href",
      "/lab",
    );
    expect(screen.getByRole("link", { name: /tune profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("renders dashboard actions when signed in", () => {
    render(<AgentLanding isAuthenticated={true} />);

    // Hero actions for authenticated users
    expect(
      screen.getAllByRole("link", { name: /go to lab/i })[0],
    ).toHaveAttribute("href", "/lab");
    expect(
      screen.getByRole("link", { name: /go to missions/i }),
    ).toHaveAttribute("href", "/missions");

    // Guest CTAs should be hidden/changed
    expect(
      screen.queryByRole("link", { name: /try lab/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /try missions/i }),
    ).not.toBeInTheDocument();
  });
});
