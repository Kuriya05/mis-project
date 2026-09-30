import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary, btnSecondary, card } from "@/components/shared/classes";
import { LogoutIcon, PageHeader } from "@/csmju";
import { DEMO_MODE } from "@/lib/demo/flag";

export const metadata: Metadata = { title: "ออกจากระบบ" };

// เปิดด้วย GET ต้องไม่ออกจากระบบทันที — ปุ่มยืนยันส่ง POST /auth/logout
// ซึ่งลบคุกกี้ของระบบนี้แล้วพาไป /logout ของ Core Hub เพื่อออกทั้งระบบ (auth-contract.md ข้อ 7)
export default function LogoutPage() {
  return (
    <>
      <PageHeader title="ออกจากระบบ" description="ออกจาก CSMJU Helpdesk และทุกระบบของ CSMJU" />
      <div className={`${card} max-w-lg px-6 py-8 fade-slide-up stagger-1`}>
        <p className="text-body-md text-on-surface-variant">
          เมื่อออกจากระบบแล้ว ต้องเข้าสู่ระบบผ่าน CSMJU Core Hub อีกครั้งจึงจะใช้งานต่อได้
        </p>
        {DEMO_MODE ? (
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <p className="mr-auto text-body-sm text-on-surface-variant">โหมดตัวอย่างไม่มีการออกจากระบบจริง</p>
            <Link href="/" className={btnPrimary}>
              กลับหน้าแรก
            </Link>
          </div>
        ) : (
          <form method="post" action="/auth/logout" className="mt-6 flex flex-wrap justify-end gap-3">
            <Link href="/" className={btnSecondary}>
              ยกเลิก
            </Link>
            <button type="submit" className={btnPrimary}>
              <LogoutIcon className="h-4 w-4" /> ยืนยันออกจากระบบ
            </button>
          </form>
        )}
      </div>
    </>
  );
}
