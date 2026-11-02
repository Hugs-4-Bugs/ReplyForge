import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT set `output: "standalone"` here.
  // That mode is for self-hosted Docker/bun deployments and breaks Vercel.
  // Vercel auto-detects Next.js and uses its own serverless output.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // sharp is already a dependency; this ensures Vercel uses it for image opt.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // pdf-parse and mammoth use Node APIs that don't work on Edge runtime.
  // Force all API routes to Node runtime (not Edge).
  experimental: {
    // Next 15+ — keep serverComponentsExternalPackages for native deps
    serverComponentsExternalPackages: [
      "bcryptjs",
      "mammoth",
      "pdf-parse",
      "xlsx",
      "nodemailer",
      "stripe",
      "@prisma/client",
    ],
  },
};

export default nextConfig;
