import { describe, it, expect } from "vitest";
import analyzePrompt from "@/utils/analyzePrompt";

describe("analyzePrompt", () => {
  const baseUser = {
    level: "beginner",
    expertise: "general",
    learningStyle: "visual",
    goals: [] as string[],
  };

  it("returns a string analysis", async () => {
    const result = await analyzePrompt("Hello world", baseUser);
    expect(typeof result).toBe("string");
  });

  it("includes profile-based header", async () => {
    const result = await analyzePrompt("test", baseUser);
    expect(result).toContain("analysis of your prompt");
  });

  describe("beginner level", () => {
    it("suggests more details for short prompts", async () => {
      const result = await analyzePrompt("short", {
        ...baseUser,
        level: "beginner",
      });
      expect(result).toContain("provide more details");
    });

    it("praises detailed prompts", async () => {
      const longPrompt =
        "This is a very detailed prompt with many words that should be enough for a beginner user to get good feedback";
      const result = await analyzePrompt(longPrompt, {
        ...baseUser,
        level: "beginner",
      });
      expect(result).toContain("Good job");
    });
  });

  describe("intermediate level", () => {
    it("notes concise prompts (< 20 words)", async () => {
      const result = await analyzePrompt("short prompt here", {
        ...baseUser,
        level: "intermediate",
      });
      expect(result).toContain("concise");
    });

    it("notes overly detailed prompts (> 50 words)", async () => {
      const longPrompt = Array(60).fill("word").join(" ");
      const result = await analyzePrompt(longPrompt, {
        ...baseUser,
        level: "intermediate",
      });
      expect(result).toContain("quite detailed");
    });

    it("notes appropriate length prompts (20-50 words)", async () => {
      const prompt = Array(30).fill("word").join(" ");
      const result = await analyzePrompt(prompt, {
        ...baseUser,
        level: "intermediate",
      });
      expect(result).toContain("appropriate");
    });
  });

  describe("advanced level", () => {
    it("suggests conciseness for long prompts (> 30 words)", async () => {
      const longPrompt = Array(40).fill("word").join(" ");
      const result = await analyzePrompt(longPrompt, {
        ...baseUser,
        level: "advanced",
      });
      expect(result).toContain("more concise");
    });

    it("notes concise prompts are good for advanced", async () => {
      const result = await analyzePrompt("short prompt", {
        ...baseUser,
        level: "advanced",
      });
      expect(result).toContain("concise");
    });
  });

  describe("learning style", () => {
    it("gives visual advice", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        learningStyle: "visual",
      });
      expect(result).toContain("visual elements");
    });

    it("gives auditory advice", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        learningStyle: "auditory",
      });
      expect(result).toContain("verbally");
    });

    it("gives kinesthetic advice", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        learningStyle: "kinesthetic",
      });
      expect(result).toContain("hands-on");
    });
  });

  describe("goals", () => {
    it("addresses 'Improve writing skills' goal", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        goals: ["Improve writing skills"],
      });
      expect(result).toContain("writing styles");
    });

    it("addresses 'Learn advanced techniques' goal", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        goals: ["Learn advanced techniques"],
      });
      expect(result).toContain("advanced techniques");
    });

    it("addresses 'Increase efficiency' goal", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        goals: ["Increase efficiency"],
      });
      expect(result).toContain("efficiency");
    });

    it("addresses 'Explore creative applications' goal", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        goals: ["Explore creative applications"],
      });
      expect(result).toContain("creative applications");
    });

    it("handles multiple goals", async () => {
      const result = await analyzePrompt("test", {
        ...baseUser,
        goals: ["Improve writing skills", "Increase efficiency"],
      });
      expect(result).toContain("writing styles");
      expect(result).toContain("efficiency");
    });
  });

  describe("general analysis", () => {
    it("suggests adding context when missing", async () => {
      const result = await analyzePrompt("do something", baseUser);
      expect(result).toContain("context");
    });

    it("does not suggest context when 'context' is present", async () => {
      const result = await analyzePrompt(
        "Here is the context for my request",
        baseUser,
      );
      expect(result).not.toContain("adding more context");
    });

    it("suggests being more specific when no polite request form", async () => {
      const result = await analyzePrompt("do this thing", baseUser);
      expect(result).toContain("more specific");
    });

    it("does not suggest specificity when 'please' is used", async () => {
      const result = await analyzePrompt("please do this thing", baseUser);
      expect(result).not.toContain("more specific");
    });

    it("does not suggest specificity when 'can you' is used", async () => {
      const result = await analyzePrompt("can you do this thing", baseUser);
      expect(result).not.toContain("more specific");
    });
  });
});
