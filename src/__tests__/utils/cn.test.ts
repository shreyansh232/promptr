import { describe, it, expect } from "vitest";
import { cn } from "@/utils/cn";

describe("cn (utils)", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("handles falsy values", () => {
    expect(cn("a", false, null, undefined, 0, "b")).toBe("a b");
  });

  it("merges conflicting tailwind utilities", () => {
    expect(cn("mt-4", "mt-8")).toBe("mt-8");
  });

  it("handles empty call", () => {
    expect(cn()).toBe("");
  });

  it("handles object syntax", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });

  it("handles nested arrays", () => {
    expect(cn(["a", ["b", "c"]])).toBe("a b c");
  });
});
