import type { Metadata } from "next";
import Link from "next/link";
import NewQuestionView from "@/components/features/questions/new/NewQuestionView";
import { ArrowBackIcon, PageHeader } from "@/csmju";

export const metadata: Metadata = { title: "ตั้งคำถาม" };

export default function NewQuestionPage() {
  return (
    <>
      <Link
        href="/questions"
        className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 pl-2 text-label-md text-on-surface-variant transition-colors duration-150 hover:bg-surface-variant/50 hover:text-primary-container"
      >
        <ArrowBackIcon className="h-5 w-5" /> กลับไปหน้ากระทู้
      </Link>
      <PageHeader
        title="ตั้งคำถาม"
        description="อธิบายปัญหาให้ชัดเจน แนบโค้ดที่เกี่ยวข้อง แล้วติดแท็กให้เพื่อน ๆ และอาจารย์หาเจอง่าย"
      />
      <NewQuestionView />
    </>
  );
}
