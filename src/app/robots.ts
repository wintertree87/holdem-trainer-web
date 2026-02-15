import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://holdem-trainer-web-yy8p.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
