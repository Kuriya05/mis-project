import { formatDateTime } from "@/lib/format";

export default function EditedLabel({ at }: { at: string | null }) {
  if (!at) return null;
  return (
    <span className="text-caption text-secondary" title={`แก้ไขเมื่อ ${formatDateTime(at)}`}>
      · แก้ไขแล้ว
    </span>
  );
}
