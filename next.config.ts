import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.watchmode.com", pathname: "/**" },
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
      { protocol: "https", hostname: "m.media-amazon.com", pathname: "/**" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "watchily-ho",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
