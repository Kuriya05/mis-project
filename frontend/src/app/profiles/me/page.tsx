import type { Metadata } from "next";
import MyProfilePanel from "@/components/features/profile/MyProfilePanel";
import { PageHeader } from "@/csmju";

export const metadata: Metadata = { title: "ข้อมูลของฉัน" };

// โปรไฟล์โหลดมาแล้วใน root layout — แผงข้อมูลอ่านจาก useSession() ฝั่ง client
export default function MyProfilePage() {
  return (
    <>
      <PageHeader title="ข้อมูลของฉัน" description="ชื่อที่แสดง บทบาท และอีเมลของบัญชีที่ใช้ใน CSMJU Helpdesk" />
      <MyProfilePanel />
    </>
  );
}
