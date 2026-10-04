"use client";

import Link from "next/link";
import Avatar from "@/components/shared/Avatar";
import { useSession } from "@/components/shared/SessionProvider";
import { btnSecondary, card } from "@/components/shared/classes";
import { LogoutIcon, MailIcon } from "@/csmju";
import { authorLabel, roleBadgeClass, roleLabel } from "@/lib/permissions";

// ข้อมูลของฉัน — อ่านอย่างเดียว ระบบนี้ไม่เก็บชื่อผู้ใช้ (reference-data.md ข้อ 8)
// กระทู้และคำตอบแสดงรหัสบุคคลจาก Core Hub หรือ role เมื่อบัญชีไม่ผูกกับบุคคล
export default function MyProfilePanel() {
  const { profile } = useSession();
  const label = authorLabel(profile);

  return (
    <div className={`${card} max-w-2xl fade-slide-up stagger-1`}>
      <div className="flex items-center gap-4 border-b border-outline-variant/40 px-6 py-5">
        <Avatar name={label} size="lg" />
        <div className="min-w-0 space-y-1">
          <h2 className="truncate font-display text-headline-md text-on-surface">{label}</h2>
          <span className={`inline-block ${roleBadgeClass(profile.coreRole)}`}>{roleLabel(profile.coreRole)}</span>
          {profile.email && (
            <p className="flex items-center gap-1.5 truncate text-body-md text-on-surface-variant">
              <MailIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
          )}
        </div>
      </div>

      <p className="px-6 py-5 text-body-md text-on-surface-variant">
        {profile.personCode
          ? "กระทู้และคำตอบของคุณแสดงด้วยรหัสนี้คู่กับบทบาท ข้อมูลบุคคลจัดการที่ CSMJU Core Hub"
          : "บัญชีนี้ยังไม่ผูกกับรหัสบุคคลใน CSMJU Core Hub กระทู้และคำตอบของคุณจึงแสดงเป็นบทบาทแทน"}
      </p>

      <div className="flex justify-end border-t border-outline-variant/40 px-6 py-4">
        <Link href="/logout" className={btnSecondary}>
          <LogoutIcon className="h-4 w-4" /> ออกจากระบบ
        </Link>
      </div>
    </div>
  );
}
