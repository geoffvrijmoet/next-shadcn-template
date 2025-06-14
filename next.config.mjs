/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to successfully complete even if
    // there are ESLint errors. Local dev linting still applies.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
