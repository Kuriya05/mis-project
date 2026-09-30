"use client";

import { useEffect, useState } from "react";
import { justReturnedFromSignIn, signIn } from "@/lib/api";
import { btnPrimary, card } from "./classes";
import { SpinnerIcon } from "./icons";
import SignInAgain from "./SignInAgain";

/**
 * หน้าที่ root layout แสดงเมื่อยังไม่มี session หรือโหลดโปรไฟล์ไม่ได้
 * - signed-out: พาทั้งหน้าไป /auth/login (Silent re-SSO) ถ้าเพิ่งกลับมาแล้วยังไม่ได้ ให้กดเอง
 * - error: backend ไม่ตอบ ให้ผู้ใช้ลองใหม่
 */
export default function SignedOutScreen({ reason }: { reason: "signed-out" | "error" }) {
  const [looping, setLooping] = useState(false);

  useEffect(() => {
    if (reason !== "signed-out") return;
    if (justReturnedFromSignIn()) setLooping(true);
    else signIn();
  }, [reason]);

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      {reason === "error" ? (
        <div role="alert" className={`${card} max-w-md px-6 py-12 text-center`}>
          <h1 className="mb-2 font-display text-headline-md text-on-surface">เชื่อมต่อเซิร์ฟเวอร์ไม่ได้</h1>
          <p className="mb-6 text-body-md text-on-surface-variant">กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง</p>
          <button type="button" onClick={() => window.location.reload()} className={`${btnPrimary} mx-auto`}>
            ลองอีกครั้ง
          </button>
        </div>
      ) : looping ? (
        <SignInAgain />
      ) : (
        <p role="status" className="flex items-center gap-2 text-body-md text-on-surface-variant">
          <SpinnerIcon className="h-5 w-5 animate-spin" /> กำลังเข้าสู่ระบบ...
        </p>
      )}
    </main>
  );
}
