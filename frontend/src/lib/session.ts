import { cookies } from "next/headers";
import { DEMO_MODE } from "./demo/flag";
import { demoProfile } from "./demo/profile";
import type { MyProfile, SuccessEnvelope } from "./types";

// ใช้ฝั่ง server เท่านั้น (Server Component / layout)

// ชื่อคุกกี้ session ของระบบย่อยนี้: <SUBSYSTEM_ID>_access_token (ขีดเป็นขีดล่าง)
const SESSION_COOKIE = `${(process.env.SUBSYSTEM_ID || "csmju-study-qa").replace(/-/g, "_")}_access_token`;

const BACKEND_URL = (process.env.BACKEND_URL || "http://127.0.0.1:4235").replace(/\/+$/, "");

export type SessionResult =
  | { status: "ready"; profile: MyProfile }
  | { status: "signed-out" }
  | { status: "error" };

/**
 * อ่านโปรไฟล์ของผู้ใช้จาก backend ด้วยคุกกี้ session ของระบบนี้ตัวเดียว
 * (auth-contract.md ข้อ 6: ห้ามอ่านคุกกี้ของ Core Hub ที่เบราว์เซอร์ส่งมาด้วยตอนอยู่บน localhost)
 */
export async function loadSession(): Promise<SessionResult> {
  if (DEMO_MODE) {
    return { status: "ready", profile: demoProfile() };
  }

  const jar = await cookies();

  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "signed-out" };

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/profiles/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}`, accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401) return { status: "signed-out" };
    if (!res.ok) return { status: "error" };
    const body = (await res.json()) as SuccessEnvelope<MyProfile>;
    return { status: "ready", profile: body.data };
  } catch {
    return { status: "error" };
  }
}

/**
 * ผู้เรียก route ฝั่ง server ของหน้าเว็บ (เช่น /assistant/chat) login อยู่หรือไม่ — ถามจาก backend
 * ด้วยคุกกี้ session ของระบบนี้ (GET /api/v1/me ตรวจ token อย่างเดียว ไม่แตะฐานข้อมูล)
 * คืน core_user_id ไว้ใช้จำกัดจำนวนคำขอ หรือ null เมื่อไม่ได้ login · โหมดตัวอย่างคืน "demo"
 */
export async function sessionCoreUserId(): Promise<string | null> {
  if (DEMO_MODE) return "demo";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/me`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}`, accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as SuccessEnvelope<{ id?: string }>;
    return typeof body.data?.id === "string" ? body.data.id : null;
  } catch {
    return null;
  }
}
