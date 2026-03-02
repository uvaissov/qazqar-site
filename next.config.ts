import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9002",
        pathname: "/qazqar-images/**",
      },
      {
        protocol: "https",
        hostname: "qazqar.kz",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
