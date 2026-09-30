import { card } from "@/components/shared/classes";

// Skeleton ของการ์ดกระทู้ (ui-design-system.md ข้อ 9.1) — ใช้ทั้งใน loading.tsx และตอนโหลดรายการ
export default function QuestionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${card} flex animate-pulse gap-4 p-4 sm:p-6`}>
          <div className="w-12 space-y-2">
            <div className="h-11 rounded-lg bg-surface-container" />
            <div className="h-9 rounded-lg bg-surface-container" />
          </div>
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-3 w-40 rounded-full bg-surface-container" />
            <div className="h-4 w-3/4 rounded-full bg-surface-container-high" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-surface-container" />
              <div className="h-5 w-16 rounded-full bg-surface-container" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
