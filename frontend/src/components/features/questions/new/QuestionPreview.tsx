import Avatar from "@/components/shared/Avatar";
import { card } from "@/components/shared/classes";
import { EyeIcon, StatusBadge } from "@/csmju";
import { tagClass } from "@/lib/tags";
import { LightbulbIcon } from "./EditorIcons";

const TIPS = [
  "ตั้งหัวข้อให้เจาะจง เช่น ใส่ชื่อ error หรือชื่อวิชา",
  "บอกสิ่งที่ลองทำไปแล้ว และผลลัพธ์ที่คาดหวัง",
  "แปะโค้ดด้วยปุ่ม “แทรก Code Block” เพื่อให้อ่านง่าย",
  "เลือกแท็กที่มีอยู่ก่อน เพื่อให้คนที่ถนัดเรื่องนั้นเห็น",
];

// แถบข้าง: ตัวอย่างการ์ดในหน้ารวมกระทู้ + เคล็ดลับ
export default function QuestionPreview({
  authorName,
  title,
  tags,
}: {
  authorName: string;
  title: string;
  tags: string[];
}) {
  return (
    <aside className="fade-slide-up space-y-6 lg:sticky lg:top-24" aria-label="ตัวอย่างและเคล็ดลับ">
      <div className={`${card} p-6`}>
        <h2 className="mb-3 flex items-center gap-2 text-label-md text-on-surface-variant">
          <EyeIcon className="h-4 w-4" /> ตัวอย่างในหน้ารวมกระทู้
        </h2>
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-4">
          <div className="flex items-center gap-2 text-caption text-secondary">
            <Avatar name={authorName} size="xs" />
            <span className="truncate text-label-sm text-on-surface">{authorName}</span>
            <span aria-hidden="true">·</span>
            <span>เมื่อสักครู่</span>
            <span className="ml-auto">
              <StatusBadge tone="warning" label="รอคำตอบ" />
            </span>
          </div>
          <h3
            className={`mt-2 line-clamp-3 text-body-lg font-semibold ${title.trim() ? "text-on-surface" : "text-outline"}`}
          >
            {title.trim() || "หัวข้อคำถามจะแสดงตรงนี้"}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span key={tag} className={tagClass(tag)}>
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-caption text-outline">#แท็ก</span>
            )}
          </div>
        </div>
      </div>

      <div className={`${card} p-6`}>
        <h2 className="mb-4 flex items-center gap-3 text-body-md font-semibold text-on-surface">
          <span className="rounded-lg bg-primary-container/10 p-2 text-primary-container">
            <LightbulbIcon className="h-5 w-5" />
          </span>
          เคล็ดลับให้ได้คำตอบเร็ว
        </h2>
        <ol className="space-y-3 text-sm leading-relaxed text-on-surface-variant">
          {TIPS.map((tip, i) => (
            <li key={tip} className="flex gap-3">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container text-label-sm text-on-surface-variant tabular-nums"
              >
                {i + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
