import type { Metadata } from "next";
import StatsDashboard from "@/components/features/stats/StatsDashboard";
import { PageHeader } from "@/csmju";

export const metadata: Metadata = { title: "ภาพรวม" };

export default function StatsPage() {
  return (
    <>
      <PageHeader
        title="ภาพรวมกระดานถาม-ตอบ"
        description="จำนวนกระทู้ อัตราที่แก้ไขแล้ว แท็กยอดนิยม และผู้ช่วยตอบดีเด่น"
      />
      <StatsDashboard />
    </>
  );
}
