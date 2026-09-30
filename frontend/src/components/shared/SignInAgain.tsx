"use client";

import { signIn } from "@/lib/api";
import { btnPrimary, card } from "./classes";
import { LoginIcon } from "./icons";

/** แสดงเมื่อ re-SSO แล้วยังได้ 401 ภายใน 30 วินาที (auth-contract.md ข้อ 7 กันวน) */
export default function SignInAgain() {
  return (
    <div className={`${card} mx-auto max-w-md px-6 py-12 text-center fade-slide-up`}>
      <h1 className="mb-2 font-display text-headline-md text-on-surface">เซสชันหมดอายุ</h1>
      <p className="mb-6 text-body-md text-on-surface-variant">
        กรุณาเข้าสู่ระบบผ่าน CSMJU Core Hub อีกครั้งเพื่อใช้งานต่อ
      </p>
      <button type="button" onClick={signIn} className={`${btnPrimary} mx-auto`}>
        <LoginIcon className="h-4 w-4" /> เข้าสู่ระบบอีกครั้ง
      </button>
    </div>
  );
}
