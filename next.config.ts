import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.arasaac.org" },
      { protocol: "https", hostname: "api.arasaac.org", pathname: "/v1/pictograms/**" },
    ],
  },
};

export default nextConfig;
