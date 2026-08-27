/** @type {import('next').NextConfig} */

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const hasValidApiBaseUrl =
  apiBaseUrl && (apiBaseUrl.startsWith("http://") || apiBaseUrl.startsWith("https://"));

const nextConfig = {
  async rewrites() {
    if (!hasValidApiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiBaseUrl}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
