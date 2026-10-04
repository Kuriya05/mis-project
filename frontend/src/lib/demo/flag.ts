// โหมดตัวอย่าง (pnpm --filter frontend dev:demo): เปิดดูทุกหน้าได้โดยไม่ต้องมี Core Hub และ backend
// ใช้ผู้ใช้สมมติกับข้อมูลตัวอย่างในหน่วยความจำ · ตอน build จริง NODE_ENV เป็น production โหมดนี้จึงปิดเสมอ
export const DEMO_MODE =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "1";
