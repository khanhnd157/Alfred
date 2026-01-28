import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@databricks/sql', 'lz4'],
  // Keep any other config options you have here
};

export default nextConfig;