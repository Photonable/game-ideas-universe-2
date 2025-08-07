/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pass environment variables to the client
  env: {
    FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  allowedDevOrigins: ["*.preview.same-app.com"],
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  // Add experimental features for better performance
  experimental: {
    optimizePackageImports: ['@google/generative-ai', 'firebase']
  }
};

module.exports = nextConfig;
