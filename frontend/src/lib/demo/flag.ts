// โหมดตัวอย่าง (pnpm --filter frontend dev:demo): เปิดดูทุกหน้าได้โดยไม่ต้องมี Core Hub และ backend
// ใช้ผู้ใช้สมมติกับข้อมูลตัวอย่างในหน่วยความจำ · ตอน build จริง NODE_ENV เป็น production โหมดนี้จึงปิดเสมอ
export const DEMO_MODE =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEMO_MODE === "1";

/** คุกกี้เก็บชื่อที่ผู้ใช้สมมติแก้ในหน้า "ข้อมูลของฉัน" ให้ layout ฝั่ง server เห็นชื่อใหม่ */
export const DEMO_NAME_COOKIE = "helpdesk_demo_name";
