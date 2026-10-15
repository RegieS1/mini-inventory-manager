import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kugi",
    short_name: "Kugi",
    description: "Inventory for a small shop",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#1b2420",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
