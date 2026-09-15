import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Wardrobe",
    short_name: "Wardrobe",
    description: "Приватный цифровой гардероб",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F3",
    theme_color: "#F8F7F3",
    lang: "ru",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
