import { card } from "@/components/shared/classes";

// Skeleton ที่มีรูปร่างเหมือนหน้าข้อมูลของฉัน (ui-design-system.md ข้อ 9.1) — ห้ามใช้ spinner กลางจอ
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <span className="sr-only">กำลังโหลดข้อมูล...</span>
      <div className="space-y-3">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-5 w-72 max-w-full animate-pulse rounded-lg bg-surface-container" />
      </div>
      <div className={`${card} max-w-2xl`}>
        <div className="flex items-center gap-4 border-b border-outline-variant/40 px-6 py-5">
          <div className="h-16 w-16 animate-pulse rounded-full bg-surface-container" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-surface-container" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-container" />
            <div className="h-4 w-56 max-w-full animate-pulse rounded-lg bg-surface-container" />
          </div>
        </div>
        <div className="space-y-2 px-6 py-5">
          <div className="h-4 w-32 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-11 animate-pulse rounded-lg bg-surface-container" />
          <div className="flex justify-end gap-2 pt-2">
            <div className="h-10 w-20 animate-pulse rounded-lg bg-surface-container" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-container" />
          </div>
        </div>
      </div>
    </div>
  );
}
