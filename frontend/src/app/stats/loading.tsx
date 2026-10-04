import { cardClass } from "@/csmju";

// Skeleton รูปร่างเหมือนหน้าภาพรวม (ui-design-system.md §9.1)
const bar = "animate-pulse rounded-lg bg-surface-container";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="space-y-3">
        <div className={`h-8 w-56 ${bar}`} />
        <div className={`h-5 w-80 max-w-full ${bar}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${cardClass} space-y-3 p-5`}>
            <div className={`h-4 w-24 ${bar}`} />
            <div className={`h-8 w-16 ${bar}`} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={`${cardClass} space-y-4 p-5`}>
            <div className={`h-5 w-40 ${bar}`} />
            <div className={`h-36 ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
