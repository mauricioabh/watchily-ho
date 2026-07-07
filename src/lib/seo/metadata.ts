import type { Metadata } from "next";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  PRODUCT_NAME,
  allowSearchIndexing,
  getSiteUrl,
} from "@/lib/seo/site";

export type PageMetadataInput = {
  title: string;
  description?: string;
  pathname: string;
  noIndex?: boolean;
};

function resolveTitle(title: string): string {
  return title.includes(PRODUCT_NAME) ? title : `${title} — ${PRODUCT_NAME}`;
}

function ogImageUrl(): string {
  return new URL(DEFAULT_OG_IMAGE_PATH, getSiteUrl()).href;
}

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  pathname,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const canonicalPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const pageUrl = new URL(canonicalPath, getSiteUrl()).href;
  const resolvedTitle = resolveTitle(title);
  const indexingBlocked = noIndex || !allowSearchIndexing();

  return {
    title: resolvedTitle,
    description,
    alternates: { canonical: canonicalPath },
    robots: indexingBlocked
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
          },
        },
    openGraph: {
      type: "website",
      locale: "es_MX",
      url: pageUrl,
      siteName: PRODUCT_NAME,
      title: resolvedTitle,
      description,
      images: [
        {
          url: ogImageUrl(),
          width: 512,
          height: 512,
          alt: `${PRODUCT_NAME} — dónde ver películas y series`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      images: [ogImageUrl()],
    },
  };
}

export function rootLayoutMetadata(): Metadata {
  const defaultTitle = `${PRODUCT_NAME} — Dónde ver películas y series en streaming`;
  const indexingBlocked = !allowSearchIndexing();

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: PRODUCT_NAME,
    title: {
      default: defaultTitle,
      template: `%s — ${PRODUCT_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    alternates: { canonical: "/" },
    robots: indexingBlocked
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: PRODUCT_NAME,
      title: defaultTitle,
      description: DEFAULT_DESCRIPTION,
      images: [
        {
          url: DEFAULT_OG_IMAGE_PATH,
          width: 512,
          height: 512,
          alt: defaultTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}
