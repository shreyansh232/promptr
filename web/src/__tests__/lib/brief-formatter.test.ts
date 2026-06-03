import { describe, expect, it } from "vitest";
import { parseBrief } from "@/lib/brief-formatter";

describe("parseBrief", () => {
  it("should handle null, undefined, and empty inputs", () => {
    expect(parseBrief(null)).toEqual({ intro: "", points: [] });
    expect(parseBrief(undefined)).toEqual({ intro: "", points: [] });
    expect(parseBrief("")).toEqual({ intro: "", points: [] });
  });

  it("should return short single-sentence descriptions as-is with no points", () => {
    const text = "Write instructions for a simple support agent.";
    expect(parseBrief(text)).toEqual({
      intro: text,
      points: [],
    });
  });

  it("should parse parenthesized numbered lists with intro and bullet points", () => {
    const text =
      "Implement a response workflow: (1) parse user intent, (2) decide if tool is required, (3) call tool.";
    const result = parseBrief(text);
    expect(result.intro).toBe("Implement a response workflow");
    expect(result.points).toEqual([
      "Parse user intent.",
      "Decide if tool is required.",
      "Call tool.",
    ]);
  });

  it("should parse inline numbered lists and capture extra sentences as points", () => {
    const text =
      "Implement a workflow: (1) parse user intent, (2) call tool. Enforce safety at all costs. Never leak credentials.";
    const result = parseBrief(text);
    expect(result.intro).toBe("Implement a workflow");
    expect(result.points).toEqual([
      "Parse user intent.",
      "Call tool.",
      "Enforce safety at all costs.",
      "Never leak credentials.",
    ]);
  });

  it("should split multiple sentences into intro and points for longer texts", () => {
    const text =
      "This is a very long instruction set for a complex bot that needs custom behavior. First, greet the customer nicely. Second, verify the order details. Third, refund if appropriate.";
    const result = parseBrief(text);
    expect(result.intro).toBe(
      "This is a very long instruction set for a complex bot that needs custom behavior.",
    );
    expect(result.points).toEqual([
      "First, greet the customer nicely.",
      "Second, verify the order details.",
      "Third, refund if appropriate.",
    ]);
  });

  it("should not incorrectly split sentences on common abbreviations like e.g. and i.e.", () => {
    const text =
      "Refuse requests for disallowed content (e.g., commit wrongdoing, credential theft, i.e., stealing passwords). Keep instructions clean.";
    const result = parseBrief(text);
    expect(result.intro).toBe(
      "Refuse requests for disallowed content (e.g., commit wrongdoing, credential theft, i.e., stealing passwords).",
    );
    expect(result.points).toEqual(["Keep instructions clean."]);
  });

  it("should parse multi-line text descriptions correctly", () => {
    const text = "Instructions:\n- Line 1\n* Line 2\n3. Line 3";
    const result = parseBrief(text);
    expect(result.intro).toBe("Instructions:");
    expect(result.points).toEqual(["Line 1", "Line 2", "Line 3"]);
  });
});
