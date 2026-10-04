"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChatBubblesIcon } from "@/components/shared/icons";
import { ArrowForwardIcon } from "@/csmju";
import { api, unwrap } from "@/lib/api";
import type { Activity, SuccessEnvelope } from "@/lib/types";

// แถบบอกว่ามีคำตอบใหม่ในกระทู้ของเรา — ใช้แทนกระดิ่งแจ้งเตือนที่อยู่ใน CsmjuAppShell (แก้ไม่ได้ ข้อ 17.4)
// โหลดไม่สำเร็จก็ไม่แสดงอะไร: เป็นแค่ทางลัด ไม่ใช่ข้อมูลหลักของหน้า
export default function ActivityBanner() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<SuccessEnvelope<Activity>>("/api/v1/profiles/me/activity")
      .then((res) => {
        if (!cancelled) setUnread(unwrap(res).unreadCount);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (unread === 0) return null;

  return (
    <Link
      href="/profiles/me#activity"
      className="fade-slide-up flex items-center gap-3 rounded-xl border border-primary-container/20 bg-primary-container/5 px-4 py-3 text-label-md text-primary-container transition-colors hover:bg-primary-container/10"
    >
      <ChatBubblesIcon className="h-5 w-5 shrink-0" />
      <span className="flex-1">มีคำตอบใหม่ {unread} รายการในกระทู้ของคุณ</span>
      <span className="flex items-center gap-1 text-label-sm">
        ดูทั้งหมด <ArrowForwardIcon className="h-4 w-4" />
      </span>
    </Link>
  );
}
