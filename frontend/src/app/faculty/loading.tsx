import { cardClass } from "@/csmju";

// Skeleton รูปร่างเหมือนหน้าทำเนียบอาจารย์ (design-system.md §9.1)
const bar = "animate-pulse rounded-lg bg-surface-container";

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="space-y-3">
        <div className={`h-8 w-48 ${bar}`} />
        <div className={`h-5 w-80 max-w-full ${bar}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${cardClass} space-y-3 p-6`}>
            <div className={`h-4 w-24 ${bar}`} />
            <div className={`h-8 w-12 ${bar}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className={`${cardClass} space-y-3 p-6 xl:col-span-2`}>
          <div className={`h-6 w-64 max-w-full ${bar}`} />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`h-5 ${bar}`} />
          ))}
        </div>
        <div className={`${cardClass} space-y-3 p-6`}>
          <div className={`h-10 w-10 ${bar}`} />
          <div className={`h-6 w-40 ${bar}`} />
          <div className={`h-16 ${bar}`} />
        </div>
      </div>
      <div className={`h-11 ${bar}`} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${cardClass} space-y-4 p-6`}>
            <div className="flex gap-4">
              <div className={`h-16 w-16 shrink-0 ${bar}`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-24 ${bar}`} />
                <div className={`h-5 w-48 max-w-full ${bar}`} />
                <div className={`h-4 w-32 ${bar}`} />
              </div>
            </div>
            <div className={`h-6 w-3/4 ${bar}`} />
            <div className={`h-16 ${bar}`} />
            <div className={`h-10 ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
