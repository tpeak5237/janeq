import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://janeq.theerapat.org", lastModified: new Date("2026-08-03"), changeFrequency: "monthly", priority: 1 }];
}
