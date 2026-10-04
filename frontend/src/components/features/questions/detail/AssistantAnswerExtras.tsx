import Link from "next/link";
import FacultyPhoto from "@/components/features/faculty/FacultyPhoto";
import { card } from "@/components/shared/classes";
import { SparklesIcon } from "@/components/shared/icons";
import { DescriptionIcon, MailIcon } from "@/csmju";
import { FACULTY, type FacultyMember } from "@/data/faculty";
import type { Comment } from "@/lib/types";

// ส่วนท้ายของคำตอบจากผู้ช่วย AI: กระทู้เดิมที่ถามเรื่องเดียวกัน (ถ้ามี) + อาจารย์ทุกคนที่ถนัดเรื่องนี้ (จากแท็กและเนื้อหา)
// backend เก็บแค่ id ของอาจารย์ ชื่อและช่องทางติดต่อมาจากทำเนียบในหน้าเว็บ (data/faculty.ts)
export default function AssistantAnswerExtras({ answer }: { answer: Comment }) {
  const lecturers = answer.recommendedFacultyIds
    .map((id) => FACULTY.find((f) => f.id === id))
    .filter((f): f is FacultyMember => f !== undefined);

  return (
    <div className="space-y-3">
      {answer.relatedQuestions.length > 0 && (
        <div className="rounded-lg bg-primary-container/5 px-4 py-3">
          <p className="text-label-md text-on-surface">กระทู้ที่เคยถามเรื่องนี้ไว้แล้ว</p>
          <ul className="mt-2 space-y-1">
            {answer.relatedQuestions.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/questions/${q.id}`}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-label-md text-primary-container transition-colors hover:bg-primary-container/10"
                >
                  <DescriptionIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{q.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lecturers.length > 0 && (
        <section aria-label="อาจารย์ที่ถนัดเรื่องนี้" className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-md text-on-surface">
              อาจารย์ที่ถนัดเรื่องนี้ <span className="text-secondary">({lecturers.length} ท่าน)</span>
            </p>
            <Link href="/faculty" className="text-label-sm text-primary-container hover:underline">
              ดูทำเนียบอาจารย์
            </Link>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {lecturers.map((lecturer, index) => (
              <li key={lecturer.id} className={`${card} flex items-start gap-3 p-3`}>
                <FacultyPhoto person={lecturer} />
                <div className="min-w-0 space-y-1">
                  {index === 0 && (
                    <span className="inline-block rounded-full bg-primary-container/10 px-2 py-0.5 text-caption text-primary-container">
                      ตรงที่สุด
                    </span>
                  )}
                  <p className="text-label-md text-on-surface">
                    {lecturer.prefix}
                    {lecturer.nameTh}
                  </p>
                  <p className="text-caption text-on-surface-variant">{lecturer.expertise.join(" · ")}</p>
                  <a
                    href={`mailto:${lecturer.email}`}
                    className="flex items-center gap-1 text-label-sm text-primary-container hover:underline"
                  >
                    <MailIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{lecturer.email}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="flex items-center gap-1 text-caption text-secondary">
        <SparklesIcon className="h-3.5 w-3.5 shrink-0" />
        {answer.relatedQuestions.length > 0
          ? "คำตอบนี้สร้างโดยผู้ช่วย AI จากกระทู้เดิม — ถ้ายังไม่ตรงปัญหา ตอบเพิ่มหรือรออาจารย์ยืนยันได้"
          : "คำตอบเบื้องต้นจากผู้ช่วย AI — เพื่อนและอาจารย์ตอบเพิ่มหรือยืนยันคำตอบได้"}
      </p>
    </div>
  );
}
