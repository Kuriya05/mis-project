import Link from "next/link";
import { btnSecondary, card } from "@/components/shared/classes";
import { AlertCircleIcon } from "@/components/shared/icons";
import { ArrowBackIcon } from "@/csmju";

// EmptyState ของ NOT_FOUND (design-system.md §9.3) — ไม่ใช่ error สีแดง
export default function QuestionNotFound() {
  return (
    <div className={`${card} fade-slide-up px-6 py-12 text-center`}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
        <AlertCircleIcon className="h-6 w-6" />
      </div>
      <h1 className="mb-2 font-display text-headline-md text-on-surface">ไม่พบกระทู้</h1>
      <p className="text-body-md text-on-surface-variant">
        ไม่พบข้อมูลที่คุณกำลังค้นหา อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง
      </p>
      <Link href="/questions" className={`${btnSecondary} mt-6`}>
        <ArrowBackIcon className="h-4 w-4" /> กลับไปหน้ากระทู้
      </Link>
    </div>
  );
}
