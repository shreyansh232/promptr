import type { MetadataRoute } from "next";
import { problemsList } from "@/data/problems";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://promptrai.vercel.app";
  
  const staticRoutes = [
    "",
    "/lab",
    "/missions",
    "/battles",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static routes
  for (const route of staticRoutes) {
    sitemapEntries.push({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" : "weekly",
      priority: route === "" ? 1.0 : 0.8,
    });
  }

  // Add dynamic problems routes
  for (const problem of problemsList) {
    sitemapEntries.push({
      url: `${baseUrl}/problems/${problem.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return sitemapEntries;
}
