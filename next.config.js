/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ✅ skip ESLint errors on build
  },
  typescript: {
    ignoreBuildErrors: true,    // ✅ skip TS type errors on build
  },
};

module.exports = nextConfig;
