import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

const publicRoutes = [
  "/",
  "/docs",
  "/docs/getting-started",
  "/docs/features",
  "/docs/architecture",
  "/docs/deployment",
  "/faq",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-13T00:00:00.000Z");

  return publicRoutes.map((path, index) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.7,
  }));
}
