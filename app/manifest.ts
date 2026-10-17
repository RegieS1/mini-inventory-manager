import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kugi",
    short_name: "Kugi",
    description: "Inventory for a small shop",
    id: "/welcome",
    start_url: "/welcome",
    scope: "/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#1b2420",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
