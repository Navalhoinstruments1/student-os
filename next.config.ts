import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // Fica desativado enquanto programas
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

const nextConfig: NextConfig = {
  // Esta linha diz ao Next.js para não se assustar com o plugin PWA
  turbopack: {}, 
};

export default withPWA(nextConfig);