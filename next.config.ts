import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/other devices on the local network use dev-mode features
  // (hot reload, client JS) when visiting via the machine's LAN IP.
  // Dev-only — has no effect on production builds.
  allowedDevOrigins: ["10.45.8.199"],
};

export default nextConfig;
