import type { MetadataRoute } from "next";
import { getServerI18n } from "@/i18n/server";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { locale, t } = await getServerI18n();
  return {
    name: "AI Wardrobe",
    short_name: "Wardrobe",
    description: t("Приватный цифровой гардероб."),
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F3",
    theme_color: "#F8F7F3",
    lang: locale,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
