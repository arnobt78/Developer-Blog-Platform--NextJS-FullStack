import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Turbopack is enabled via --turbo flag in dev script
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Configure static file serving for uploads
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
  // Experimental features optimized for React 19
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Enable optimized package imports
    optimizePackageImports: ["react-icons"],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
