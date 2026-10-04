import type { NextConfig } from "next";

// frontend (:3235) คือประตูเดียวของระบบ (subsystem.yaml → base_url):
// ส่ง /api/* และ endpoint SSO 3 ตัว (auth-contract.md ข้อ 5) ต่อไป backend NestJS (:4235)
// คุกกี้ state ของ /auth/login และคุกกี้ session จึงอยู่ origin เดียวกับหน้าเว็บ
const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:4235").replace(/\/+$/, "");

// ตอน dev Next.js บล็อกไฟล์ JS ของ dev server เมื่อเปิดจาก host อื่นที่ไม่ใช่ localhost (เช่น IP ของ VPN
// ที่ให้เพื่อนเปิดดู) — หน้าเว็บขึ้นแต่ปุ่มทุกปุ่มกดไม่ได้ · ใส่ host ที่อนุญาตใน .env.local คั่นด้วยจุลภาค
// เช่น DEV_ALLOWED_ORIGINS=26.155.53.96 · ไม่มีผลกับ production (next build / next start)
// ระวัง: login ผ่าน Core Hub ต้องเปิดด้วย localhost ตามที่ลงทะเบียน callback ไว้เสมอ
const DEV_ALLOWED_ORIGINS = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: DEV_ALLOWED_ORIGINS,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/auth/login", destination: `${BACKEND_URL}/auth/login` },
      { source: "/auth/callback", destination: `${BACKEND_URL}/auth/callback` },
      { source: "/auth/logout", destination: `${BACKEND_URL}/auth/logout` },
    ];
  },
};

export default nextConfig;
