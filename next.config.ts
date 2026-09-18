import type { NextConfig } from "next";

/**
 * Orígenes autorizados para embeber /admin. Se declaran por entorno con
 * ORBITA_ALLOWED_FRAME_ANCESTORS para que la marca blanca no dependa de
 * dominios del proveedor escritos en el código. Los dominios base del CRM
 * siguen como respaldo operativo y se pueden desactivar con
 * ORBITA_STRICT_FRAME_ANCESTORS=true una vez configurado el dominio propio.
 */
const providerFrameAncestors =
  process.env.ORBITA_STRICT_FRAME_ANCESTORS === "true"
    ? []
    : ["https://*.gohighlevel.com", "https://*.leadconnectorhq.com", "https://*.msgsndr.com"];

const defaultFrameAncestors = ["'self'", ...providerFrameAncestors];

const customFrameAncestors = (
  process.env.ORBITA_ALLOWED_FRAME_ANCESTORS ??
  process.env.GHL_ALLOWED_FRAME_ANCESTORS ??
  ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const frameAncestors = [...new Set([...defaultFrameAncestors, ...customFrameAncestors])].join(" ");

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

/**
 * Las imágenes del dashboard se suben a Cloudflare R2 y se sirven desde R2_PUBLIC_URL.
 * next/image rechaza cualquier host que no esté declarado aquí, así que lo derivamos
 * de la misma variable que usa el uploader para que no haya que mantener dos listas.
 */
function r2RemotePatterns(): RemotePattern[] {
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();
  if (!publicUrl) {
    console.warn(
      "[next.config] R2_PUBLIC_URL no está definida: next/image bloqueará las imágenes subidas desde el dashboard."
    );
    return [];
  }

  try {
    const { protocol, hostname } = new URL(publicUrl);
    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        pathname: "/**",
      },
    ];
  } catch {
    console.warn(`[next.config] R2_PUBLIC_URL no es una URL válida: ${publicUrl}`);
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...r2RemotePatterns(),
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "d1b50uin55dq3m.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${frameAncestors}`,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
