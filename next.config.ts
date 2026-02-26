import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    const standalonePaths = [
      "/tv-standalone",
      "/login-standalone",
      "/search-standalone",
      "/lists-standalone",
      "/lists-all-standalone",
      "/settings-standalone",
      "/title-standalone",
      "/auth/forgot-password-standalone",
    ];
    return standalonePaths.flatMap((path) => [
      { source: path, headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] },
      { source: `${path}/:subpath*`, headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }] },
    ]);
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.watchmode.com", pathname: "/**" },
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
      { protocol: "https", hostname: "m.media-amazon.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
