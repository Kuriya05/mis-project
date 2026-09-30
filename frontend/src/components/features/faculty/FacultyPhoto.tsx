"use client";

import { useState } from "react";
import Avatar from "@/components/shared/Avatar";
import type { FacultyMember } from "@/data/faculty";

// รูปอาจารย์มาจากเว็บไซต์สาขา (csmju.com) ซึ่งเป็นโดเมนภายนอก — ใช้ <img> ธรรมดาแทน next/image
// เพราะ next/image กับ URL ภายนอกต้องเพิ่ม images.remotePatterns ใน next.config
// ถ้าไม่มีรูปหรือโหลดไม่สำเร็จ แสดงอวตารอักษรย่อแทน
export default function FacultyPhoto({ person }: { person: FacultyMember }) {
  const [failed, setFailed] = useState(false);

  if (!person.image || failed) {
    return <Avatar name={person.nameTh} size="lg" />;
  }

  return (
    <img
      src={person.image}
      alt={`${person.prefix} ${person.nameTh}`}
      loading="lazy"
      width={64}
      height={64}
      onError={() => setFailed(true)}
      className="h-16 w-16 shrink-0 rounded-xl border border-outline-variant/40 bg-surface-container object-cover object-top"
    />
  );
}
