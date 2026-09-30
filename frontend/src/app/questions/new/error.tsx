"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cardClass, primaryButtonClass, secondaryButtonClass } from "@/csmju";

// ErrorState มาตรฐาน (design-system.md §9.3 INTERNAL_ERROR) — ห้ามแสดง error.message ดิบ
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className={`${cardClass} px-6 py-12 text-center`}>
      <h1 className="mb-2 font-display text-headline-md text-on-surface">ระบบขัดข้องชั่วคราว</h1>
      <p className="text-body-md text-on-surface-variant">
        กรุณาลองอีกครั้ง หากยังพบปัญหา กรุณาแจ้งผู้ดูแลระบบ
        {error.digest && (
          <>
            {" "}
            พร้อมรหัส: <span className="tabular-nums">{error.digest}</span>
          </>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/questions" className={secondaryButtonClass}>
          กลับไปหน้ากระทู้
        </Link>
        <button type="button" onClick={() => retry()} className={primaryButtonClass}>
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  );
}
