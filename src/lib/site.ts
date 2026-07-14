import type { Metadata } from "next";

import { parsePublicEnv } from "@/lib/env";

const env = parsePublicEnv({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_REPOSITORY_URL: process.env.NEXT_PUBLIC_REPOSITORY_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
});

export const siteConfig = {
  name: "HireTrack Lite",
  shortName: "HireTrack",
  description:
    "A focused applicant tracking workspace for small teams to move every candidate forward with clarity.",
  url: env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""),
  repositoryUrl: env.NEXT_PUBLIC_REPOSITORY_URL || undefined,
  contactEmail: "hello@hiretrack.example",
} as const;

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteConfig.url}/`).toString();
}

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createMetadata({
  title,
  description,
  path,
  noIndex = false,
}: MetadataOptions): Metadata {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} product preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/opengraph-image")],
    },
  };
}
