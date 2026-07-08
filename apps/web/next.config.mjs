/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next must transpile them.
  transpilePackages: ['@swift2/shared', '@swift2/core'],
  images: {
    // YouTube poster thumbnails for the click-to-play music-video facade.
    remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }],
  },
};

export default nextConfig;
