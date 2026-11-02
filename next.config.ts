import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: Do NOT set `output: "standalone"` here.
  // That mode is for self-hosted Docker/bun deployments and breaks Vercel.
  // Vercel auto-detects Next.js and uses its own serverless output.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // sharp is already a dependency; this ensures Vercel uses it for image opt.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Next.js 16: `serverExternalPackages` (top-level, not under experimental).
  // Tells Next.js to NOT bundle these Node-only packages; they're required
  // at runtime (native deps, Prisma client, etc.).
  serverExternalPackages: [
    "bcryptjs",
    "mammoth",
    "pdf-parse",
    "xlsx",
    "nodemailer",
    "stripe",
    "@prisma/client",
  ],
};

export default nextConfig;
