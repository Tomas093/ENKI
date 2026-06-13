import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Next.js new config option
  allowedDevOrigins: ['192.168.68.55', 'localhost', '127.0.0.1'],
};

export default nextConfig;
