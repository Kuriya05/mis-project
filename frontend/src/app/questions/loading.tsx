import { card } from "@/components/shared/classes";
import QuestionListSkeleton from "@/components/features/questions/list/QuestionListSkeleton";

// Skeleton ที่มีรูปร่างเหมือนหน้ารวมกระทู้ (ui-design-system.md ข้อ 9.1) — ห้ามใช้ spinner กลางจอ
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-5 w-72 max-w-full animate-pulse rounded-lg bg-surface-container" />
      </div>
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          <div className="h-11 animate-pulse rounded-lg bg-surface-container" />
          <div className={`${card} space-y-4 px-6 py-5`}>
            <div className="h-6 w-56 animate-pulse rounded-lg bg-surface-container" />
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-8 w-28 animate-pulse rounded-lg bg-surface-container" />
              ))}
            </div>
          </div>
          <QuestionListSkeleton />
        </div>
        <div className={`${card} h-40 animate-pulse p-4`}>
          <div className="h-4 w-24 rounded-full bg-surface-container" />
        </div>
      </div>
    </div>
  );
}
