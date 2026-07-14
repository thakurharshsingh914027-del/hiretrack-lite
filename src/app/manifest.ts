import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HireTrack Lite",
    short_name: "HireTrack",
    description: "A focused applicant tracking workspace for small teams.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f9f9f7",
    theme_color: "#08785e",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
