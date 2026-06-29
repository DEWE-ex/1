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
      {
        source: "/admin/login",
        destination: "/admin",
        permanent: true,
      },
      {
        source: "/share/saved",
        destination: "/share",
        permanent: true,
      },
      {
        source: "/share/saved/:path*",
        destination: "/share",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
