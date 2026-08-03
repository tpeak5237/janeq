import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JaneQ — Direct QR Code Generator",
    short_name: "JaneQ",
    description: "Direct, local-first QR codes without the nonsense.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef2f3",
    theme_color: "#101922",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
