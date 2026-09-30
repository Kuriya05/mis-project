import { cookies } from "next/headers";
import { DEMO_MODE, DEMO_NAME_COOKIE } from "./demo/flag";
import { demoProfile } from "./demo/profile";
import type { MyProfile, SuccessEnvelope } from "./types";

// ใช้ฝั่ง server เท่านั้น (Server Component / layout)

// ชื่อคุกกี้ session ของระบบย่อยนี้: <SUBSYSTEM_ID>_access_token (ขีดเป็นขีดล่าง)
const SESSION_COOKIE = "csmju_helpdesk_access_token";

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3002").replace(/\/+$/, "");

export type SessionResult =
  | { status: "ready"; profile: MyProfile }
  | { status: "signed-out" }
  | { status: "error" };

/**
 * อ่านโปรไฟล์ของผู้ใช้จาก backend ด้วยคุกกี้ session ของระบบนี้ตัวเดียว
 * (auth-contract.md ข้อ 6: ห้ามอ่านคุกกี้ของ Core Hub ที่เบราว์เซอร์ส่งมาด้วยตอนอยู่บน localhost)
 */
export async function loadSession(): Promise<SessionResult> {
  const jar = await cookies();
  if (DEMO_MODE) {
    const name = jar.get(DEMO_NAME_COOKIE)?.value;
    return { status: "ready", profile: demoProfile(name ? decodeURIComponent(name) : undefined) };
  }

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
