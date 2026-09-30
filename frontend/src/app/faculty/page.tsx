import type { Metadata } from "next";
import { PageHeader } from "@/csmju";
import FacultyDirectory from "@/components/features/faculty/FacultyDirectory";

export const metadata: Metadata = { title: "ทำเนียบอาจารย์" };

export default function FacultyPage() {
  return (
    <>
      <PageHeader
        title="ทำเนียบอาจารย์"
        description="ค้นหาอาจารย์ตามความถนัด เพื่อขอคำปรึกษาหรือติดต่อเรื่องโครงงาน"
      />
      <FacultyDirectory />
    </>
  );
}
