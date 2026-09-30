import type { Metadata } from "next";
import { parseForumFilters } from "@/components/features/questions/list/filters";
import QuestionBoard from "@/components/features/questions/list/QuestionBoard";
import { PageHeader } from "@/csmju";

export const metadata: Metadata = { title: "กระทู้ถามตอบ" };

// ตัวกรองอยู่ใน URL: /questions?tab=all|mine|unanswered&tag=<name>&q=<text>
export default async function QuestionsPage(props: PageProps<"/questions">) {
  const filters = parseForumFilters(await props.searchParams);

  return (
    <>
      <PageHeader
        title="กระทู้ถามตอบ"
        description="ถามปัญหาการเรียนและการเขียนโปรแกรม แล้วให้เพื่อนและอาจารย์ช่วยกันตอบ"
      />
      <QuestionBoard filters={filters} />
    </>
  );
}
