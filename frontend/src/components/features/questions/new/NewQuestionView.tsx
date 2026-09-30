"use client";

import Link from "next/link";
import { btnSecondary, card } from "@/components/shared/classes";
import { useSession } from "@/components/shared/SessionProvider";
import { LockIcon } from "@/csmju";
import QuestionForm from "./QuestionForm";

// ไม่มีสิทธิ์ question:create → การ์ด "ไม่มีสิทธิ์" (design-system.md §9.3 FORBIDDEN) แทนฟอร์ม
// backend ตรวจสิทธิ์ซ้ำเสมอ
export default function NewQuestionView() {
  const { can } = useSession();

  if (!can("question:create")) {
    return (
      <div className={`${card} fade-slide-up mx-auto max-w-md px-6 py-12 text-center`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
          <LockIcon className="h-6 w-6" />
        </div>
        <h2 className="mb-2 font-display text-headline-md text-on-surface">ตั้งคำถามไม่ได้</h2>
        <p className="text-body-md text-on-surface-variant">
          บัญชีของคุณอ่านกระทู้ได้อย่างเดียว การตั้งคำถามเปิดให้นักศึกษาและบุคลากรปัจจุบัน
          หากคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบย่อยนี้
        </p>
        <Link href="/questions" className={`${btnSecondary} mt-6`}>
          กลับไปหน้ากระทู้
        </Link>
      </div>
    );
  }

  return <QuestionForm />;
}
