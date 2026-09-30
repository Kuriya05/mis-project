
import axios, { type AxiosError, type AxiosResponse } from "axios";
import { demoAdapter } from "./demo/adapter";
import { DEMO_MODE } from "./demo/flag";
import type { ErrorCode, ErrorEnvelope, SuccessEnvelope } from "./types";

// Origin เดียวกับหน้าเว็บ: backend ส่งหน้าเว็บนี้และ /api ให้ และคุกกี้ session ของ
// Core Hub เป็น HttpOnly ที่เบราว์เซอร์แนบไปเอง (ห้ามเก็บ token ใน localStorage)
export const api = axios.create({ withCredentials: true });

// โหมดตัวอย่าง: ตอบทุก request จากข้อมูลในเบราว์เซอร์ ไม่ส่งออกไปที่ backend
if (DEMO_MODE) api.defaults.adapter = demoAdapter;

const RESSO_KEY = "helpdesk:resso-at";
const RESSO_LOOP_MS = 30_000;

/** พาทั้งหน้าไป /auth/login (ห้ามใช้ fetch) — auth-contract.md ข้อ 7 */
export function signIn(): void {
  const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  try {
    sessionStorage.setItem(RESSO_KEY, String(Date.now()));
  } catch {
    // ใช้ storage ไม่ได้: แค่ไม่มีตัวกันวน
  }
  window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`);
}

/** true เมื่อเพิ่งกลับจาก Core Hub ไม่ถึง 30 วินาทีแล้วยังได้ 401 อีก (กันวน) */
export function justReturnedFromSignIn(): boolean {
  try {
    const at = Number(sessionStorage.getItem(RESSO_KEY));
    return Number.isFinite(at) && Date.now() - at < RESSO_LOOP_MS;
  } catch {
    return false;
  }
}

let sessionExpiredHandler: () => void = () => {
  if (!justReturnedFromSignIn()) signIn();
};

/** SessionProvider ลงทะเบียนว่าจะทำอะไรเมื่อได้ 401 (re-SSO หรือแสดงปุ่มเมื่อจะวน) */
export function onSessionExpired(handler: () => void): void {
  sessionExpiredHandler = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) sessionExpiredHandler();
    return Promise.reject(error);
  },
);

/** `{ success, data }` -> data */
export function unwrap<T>(response: AxiosResponse<SuccessEnvelope<T>>): T {
  return response.data.data;
}

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  FORBIDDEN: "คุณไม่มีสิทธิ์ทำรายการนี้",
  NOT_FOUND: "ไม่พบข้อมูลนี้ อาจถูกลบไปแล้ว",
  BAD_REQUEST: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง",
  VALIDATION_ERROR: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแล้วลองอีกครั้ง",
  CONFLICT: "ทำรายการนี้ไม่ได้เพราะข้อมูลเปลี่ยนไปแล้ว กรุณารีเฟรชหน้า",
  TOO_MANY_REQUESTS: "ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่",
  SERVICE_UNAVAILABLE: "ระบบกำลังยุ่ง กรุณาลองใหม่ในอีกสักครู่",
  UNAUTHORIZED: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
  INTERNAL_ERROR: "ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง",
};

function errorBody(err: unknown): ErrorEnvelope | undefined {
  return axios.isAxiosError<ErrorEnvelope>(err) ? err.response?.data : undefined;
}

/** error.code จาก envelope (ถ้ามี) */
export function errorCode(err: unknown): string | undefined {
  return errorBody(err)?.error?.code;
}

/** ชื่อฟิลด์ที่ผิดจาก VALIDATION_ERROR — ใช้ focus ช่องที่ผิด (ui-design-system.md ข้อ 9.3) */
export function errorField(err: unknown): string | undefined {
  return errorBody(err)?.error?.details?.field;
}

/** ข้อความภาษาไทยของ request ที่ล้มเหลว ถ้าไม่รู้จัก code ใช้ `fallback` */
export function errorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err) || !err.response) {
    return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง";
  }
  const code = errorCode(err) as ErrorCode | undefined;
  return (code && MESSAGES[code]) || fallback;
}
