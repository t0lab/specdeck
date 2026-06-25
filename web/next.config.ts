import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Dev mode is served through the Cloudflare tunnel; allow that origin.
  allowedDevOrigins: ["specdeck.timezlab.org"],
};

export default nextConfig;
