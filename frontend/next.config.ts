import type { NextConfig } from "next";

// หน้าเว็บกับ API อยู่ origin เดียวกันเสมอ (subsystem.yaml → base_url):
// backend NestJS รับทุก request แล้วส่งต่อหน้าเว็บมาที่ Next server ตัวนี้
// ตอนพัฒนาเปิด Next ตรง ๆ ที่ :3102 ได้ด้วย — rewrites ด้านล่างส่ง /api และ /auth
// ต่อไปที่ backend ให้คุกกี้ session และ redirect ของ SSO ทำงานเหมือนจริง
const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3002").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/auth/:path*", destination: `${BACKEND_URL}/auth/:path*` },
    ];
  },
};

export default nextConfig;
