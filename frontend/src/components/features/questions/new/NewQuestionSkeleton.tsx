import { card } from "@/components/shared/classes";

// Skeleton รูปร่างเหมือนหน้าตั้งคำถาม (design-system.md §9.1)
export default function NewQuestionSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="h-9 w-40 animate-pulse rounded-lg bg-surface-container" />
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-surface-container" />
      </div>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className={`${card} animate-pulse space-y-8 p-6 sm:p-8 lg:col-span-2`}>
          {[1, 2, 3].map((step) => (
            <div key={step} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-surface-container" />
                <div className="h-4 w-56 rounded-full bg-surface-container" />
              </div>
              <div className={`${step === 2 ? "h-64" : "h-11"} rounded-lg bg-surface-container`} />
            </div>
          ))}
          <div className="flex justify-end gap-3">
            <div className="h-10 w-24 rounded-lg bg-surface-container" />
            <div className="h-10 w-32 rounded-lg bg-surface-container-high" />
          </div>
        </div>
        <div className="space-y-6">
          <div className={`${card} h-44 animate-pulse`} />
          <div className={`${card} h-56 animate-pulse`} />
        </div>
      </div>
    </div>
  );
}
