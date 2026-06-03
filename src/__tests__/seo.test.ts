import { describe, it, expect } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { generateMetadata } from "../app/problems/[id]/layout";
import { metadata as battlesMetadata } from "../app/battles/layout";

describe("SEO - robots.ts", () => {
  it("generates correct robots rules", () => {
    const res = robots();
    expect(res.rules).toBeDefined();
    const rules = res.rules as {
      userAgent?: string | string[];
      allow?: string | string[];
      disallow?: string | string[];
    };
    expect(rules.userAgent).toBe("*");
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toContain("/api/");
    expect(rules.disallow).toContain("/onboarding");
    expect(rules.disallow).toContain("/profile");
    expect(rules.disallow).toContain("/_next/");
    expect(rules.disallow).toContain("/static/");
  });

  it("references the correct sitemap URL", () => {
    const res = robots();
    expect(res.sitemap).toBe("https://promptrai.vercel.app/sitemap.xml");
  });
});

describe("SEO - sitemap.ts", () => {
  it("generates static entries", () => {
    const res = sitemap();
    const urls = res.map((entry) => entry.url);
    expect(urls).toContain("https://promptrai.vercel.app");
    expect(urls).toContain("https://promptrai.vercel.app/lab");
    expect(urls).toContain("https://promptrai.vercel.app/missions");
    expect(urls).toContain("https://promptrai.vercel.app/battles");
  });

  it("does not contain empty /problems path", () => {
    const res = sitemap();
    const urls = res.map((entry) => entry.url);
    expect(urls).not.toContain("https://promptrai.vercel.app/problems");
  });

  it("generates entries for each individual problem dynamically", () => {
    const res = sitemap();
    const urls = res.map((entry) => entry.url);
    
    // problemsList contains IDs 1 to 5
    expect(urls).toContain("https://promptrai.vercel.app/problems/1");
    expect(urls).toContain("https://promptrai.vercel.app/problems/2");
    expect(urls).toContain("https://promptrai.vercel.app/problems/3");
    expect(urls).toContain("https://promptrai.vercel.app/problems/4");
    expect(urls).toContain("https://promptrai.vercel.app/problems/5");
  });

  it("configures changeFrequency and priority correctly", () => {
    const res = sitemap();
    
    // Check root priority
    const rootEntry = res.find((entry) => entry.url === "https://promptrai.vercel.app");
    expect(rootEntry?.priority).toBe(1.0);
    expect(rootEntry?.changeFrequency).toBe("daily");

    // Check problems priority
    const problemEntry = res.find((entry) => entry.url === "https://promptrai.vercel.app/problems/1");
    expect(problemEntry?.priority).toBe(0.7);
    expect(problemEntry?.changeFrequency).toBe("weekly");
  });
});

describe("SEO - dynamic and static page metadata", () => {
  it("generates correct metadata for valid problems", async () => {
    // Problem 1: Product Description Generator
    const metadata = await generateMetadata({ params: { id: "1" } });
    expect(metadata.title).toBe("Product Description Generator");
    expect(metadata.description).toContain("Product Description Generator");
  });

  it("handles non-existent problems gracefully", async () => {
    const metadata = await generateMetadata({ params: { id: "999" } });
    expect(metadata.title).toBe("Problem Not Found");
    expect(metadata.description).toBeUndefined();
  });

  it("defines battles layout metadata correctly", () => {
    expect(battlesMetadata.title).toBe("Battles");
    expect(battlesMetadata.description).toContain("real-time battles");
  });
});
