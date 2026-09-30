import type { Metadata } from "next";
import QuestionDetailView from "@/components/features/questions/detail/QuestionDetailView";

export const metadata: Metadata = { title: "รายละเอียดกระทู้" };

export default async function QuestionDetailPage(props: PageProps<"/questions/[id]">) {
  const { id } = await props.params;
  return <QuestionDetailView id={id} />;
}
