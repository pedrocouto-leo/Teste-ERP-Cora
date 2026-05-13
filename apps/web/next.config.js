/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@cora-erp/shared'],
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
