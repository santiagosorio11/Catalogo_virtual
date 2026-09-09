import type { NextConfig } from "next";

const defaultFrameAncestors = [
  "'self'",
  "https://*.gohighlevel.com",
  "https://*.leadconnectorhq.com",
  "https://*.msgsndr.com",
];

const customFrameAncestors = (process.env.GHL_ALLOWED_FRAME_ANCESTORS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frameAncestors = [...new Set([...defaultFrameAncestors, ...customFrameAncestors])].join(" ");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
