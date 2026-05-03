/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  // The registry server lives at mcp.autoloops.ai. We hit it directly from the
  // browser (CORS opens it up). No rewrites needed.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ];
  }
};

export default nextConfig;
