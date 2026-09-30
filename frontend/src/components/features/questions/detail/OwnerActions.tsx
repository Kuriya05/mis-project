import { iconBtn } from "@/components/shared/classes";
import { DeleteIcon, EditIcon, iconDangerButtonClass } from "@/csmju";

// ปุ่มแก้ไข / ลบ สำหรับเจ้าของเนื้อหา (หรือผู้มีสิทธิ์ :any) — handler ที่ไม่ส่งมา = ไม่มีสิทธิ์ = ซ่อนปุ่ม
export default function OwnerActions({
  onEdit,
  onDelete,
  label,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  label: string;
}) {
  if (!onEdit && !onDelete) return null;
  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label={`แก้ไข${label}`} className={`${iconBtn} gap-1 px-2 text-label-sm`}>
          <EditIcon className="h-4 w-4" /> แก้ไข
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`ลบ${label}`}
          className={`${iconDangerButtonClass} inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-label-sm`}
        >
          <DeleteIcon className="h-4 w-4" /> ลบ
        </button>
      )}
    </div>
  );
}
