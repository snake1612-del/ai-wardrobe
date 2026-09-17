import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const allowedDevOrigin = (() => {
  if (process.env.NODE_ENV === "production" || !process.env.APP_ORIGIN) return undefined;
  try {
    return new URL(process.env.APP_ORIGIN).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(allowedDevOrigin ? { allowedDevOrigins: [allowedDevOrigin] } : {}),
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
