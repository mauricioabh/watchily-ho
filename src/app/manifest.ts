import type { MetadataRoute } from "next";
import { PRODUCT_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PRODUCT_NAME} — Dónde ver películas y series`,
    short_name: PRODUCT_NAME,
    description: DEFAULT_DESCRIPTION,
    id: "/",
    // "/" muestra login si no hay sesión; si hay usuario, Home redirige a /popular
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#05070d",
    theme_color: "#0b1120",
    lang: "es",
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
        name: "Populares",
        short_name: "Populares",
        url: "/popular",
      },
      {
        name: "Buscar",
        short_name: "Buscar",
        url: "/search",
      },
      {
        name: "Mis listas",
        short_name: "Listas",
        url: "/lists",
      },
    ],
  };
}
