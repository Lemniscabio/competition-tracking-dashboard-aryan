/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained `.next/standalone` server for a small Docker image (Cloud Run).
  output: 'standalone',
};

export default nextConfig;
