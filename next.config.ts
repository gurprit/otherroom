import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev({
  experimental: {
    remoteBindings: true,
  },
});

const nextConfig: NextConfig = {};

export default nextConfig;
