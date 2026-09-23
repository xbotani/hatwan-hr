/** @type {import('next').NextConfig} */
const nextConfig = {
  // Linting is handled separately; do not block production builds on it.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
