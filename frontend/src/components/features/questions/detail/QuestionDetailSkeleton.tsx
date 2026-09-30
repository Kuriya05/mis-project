import { card } from "@/components/shared/classes";

// Skeleton รูปร่างเหมือนหน้ารายละเอียดกระทู้ (design-system.md §9.1)
export default function QuestionDetailSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="mx-auto w-full max-w-4xl space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-container" />
      <div className={`${card} flex animate-pulse gap-6 p-6 sm:p-8`}>
        <div className="w-11 shrink-0 space-y-2">
          <div className="h-11 rounded-lg bg-surface-container" />
          <div className="h-5 rounded-full bg-surface-container" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-surface-container" />
            <div className="space-y-2">
              <div className="h-3 w-32 rounded-full bg-surface-container" />
              <div className="h-3 w-24 rounded-full bg-surface-container" />
            </div>
          </div>
          <div className="h-6 w-3/4 rounded-full bg-surface-container-high" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-surface-container" />
            <div className="h-3 w-full rounded-full bg-surface-container" />
            <div className="h-3 w-2/3 rounded-full bg-surface-container" />
          </div>
        </div>
      </div>
      <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-container" />
      <div className={`${card} h-32 animate-pulse`} />
    </div>
  );
}
