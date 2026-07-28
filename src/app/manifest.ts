import type { MetadataRoute } from "next";
import { PRODUCT_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PRODUCT_NAME} — Dónde ver películas y series`,
    short_name: PRODUCT_NAME,
    description: DEFAULT_DESCRIPTION,
    id: "/",
    // "/" shows login when logged out; authenticated users redirect to /library
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05070d",
    theme_color: "#0b1120",
    lang: "en",
    dir: "ltr",
    categories: ["entertainment", "lifestyle"],
    icons: [
      {
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Search",
        short_name: "Search",
        url: "/search",
      },
      {
        name: "My Library",
        short_name: "Library",
        url: "/library",
      },
    ],
  };
}
