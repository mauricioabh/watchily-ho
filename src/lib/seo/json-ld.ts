import type { UnifiedTitle } from "@/types/streaming";
import { DEFAULT_DESCRIPTION, PRODUCT_NAME, getSiteUrl } from "@/lib/seo/site";

export function webApplicationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: PRODUCT_NAME,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    description: DEFAULT_DESCRIPTION,
    url: getSiteUrl(),
    inLanguage: "es-MX",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function movieOrSeriesJsonLd(
  title: UnifiedTitle,
): Record<string, unknown> {
  const schemaType = title.type === "series" ? "TVSeries" : "Movie";
  const pageUrl = new URL(`/title/${title.id}`, getSiteUrl()).href;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: title.name,
    url: pageUrl,
  };

  if (title.overview) jsonLd.description = title.overview;
  if (title.year != null) jsonLd.datePublished = `${title.year}-01-01`;
  if (title.poster?.startsWith("http")) jsonLd.image = title.poster;
  if (title.genres?.length) jsonLd.genre = title.genres;
  if (title.imdbRating != null) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: title.imdbRating,
      bestRating: 10,
      worstRating: 0,
    };
  }

  return jsonLd;
}
