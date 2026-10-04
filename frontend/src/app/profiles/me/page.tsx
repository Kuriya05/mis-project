import type { Metadata } from "next";
import ActivityFeed from "@/components/features/profile/ActivityFeed";
import MyProfilePanel from "@/components/features/profile/MyProfilePanel";
import { PageHeader } from "@/csmju";

export const metadata: Metadata = { title: "ข้อมูลของฉัน" };

// โปรไฟล์โหลดมาแล้วใน root layout — แผงข้อมูลอ่านจาก useSession() ฝั่ง client
export default function MyProfilePage() {
  return (
    <>
      <PageHeader title="ข้อมูลของฉัน" description="รหัสบุคคล บทบาท อีเมล และคำตอบใหม่ในกระทู้ของคุณ" />
      <div className="space-y-6">
        <MyProfilePanel />
        <ActivityFeed />
      </div>
    </>
  );
}
