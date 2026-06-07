import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/books", destination: "/", permanent: true },
      { source: "/books/:path*", destination: "/", permanent: true },
      {
        source: "/room/:code",
        destination: "/karuta/room/:code",
        permanent: true,
      },
      {
        source: "/matchmaking",
        destination: "/karuta/matchmaking",
        permanent: true,
      },
      {
        source: "/contribute",
        destination: "/karuta/contribute",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
