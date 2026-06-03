import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NewScenarioModal } from "../NewScenarioModal";

describe("NewScenarioModal", () => {
  it("renders correctly when open", () => {
    render(
      <NewScenarioModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByText("Create Custom Prompt Test")).toBeInTheDocument();
    expect(screen.getByLabelText(/Agent Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Available Tools/i)).toBeInTheDocument();
  });

  it("submits the form with user inputs", async () => {
    const handleSubmit = vi.fn();
    render(
      <NewScenarioModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
        isLoading={false}
      />,
    );

    const descInput = screen.getByLabelText(/Agent Description/i);
    const toolsInput = screen.getByLabelText(/Available Tools/i);
    const submitBtn = screen.getByRole("button", {
      name: /create prompt test/i,
    });

    fireEvent.change(descInput, {
      target: { value: "Custom bot instructions" },
    });
    fireEvent.change(toolsInput, { target: { value: "custom_tool()" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        "Custom bot instructions",
        "custom_tool()",
      );
    });
  });

  it("disables inputs and buttons during loading state", () => {
    render(
      <NewScenarioModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isLoading={true}
      />,
    );

    expect(screen.getByLabelText(/Agent Description/i)).toBeDisabled();
    expect(screen.getByLabelText(/Available Tools/i)).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /creating prompt test/i }),
    ).toBeDisabled();
  });
});
