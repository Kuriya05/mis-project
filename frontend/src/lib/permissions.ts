import type { CoreRole, MyProfile, Permission } from "./types";

// Layer 2 ของระบบนี้: backend ตัดสินสิทธิ์จริงเสมอ หน้าเว็บแค่ซ่อนปุ่มที่ใช้ไม่ได้ (ui-design-system.md ข้อ 10)

// core role จาก Core Hub -> ป้ายที่แสดงในหน้าเว็บ
const ROLE_LABELS: Record<CoreRole, string> = {
  student: "นักศึกษา",
  alumni: "ศิษย์เก่า",
  lecturer: "อาจารย์",
  staff: "เจ้าหน้าที่",
  guest: "ผู้เยี่ยมชม",
  admin: "ผู้ดูแลระบบ",
};

export function roleLabel(coreRole: string | undefined): string {
  return ROLE_LABELS[coreRole as CoreRole] ?? "ผู้ใช้";
}

export function isStaffRole(coreRole: string | undefined): boolean {
  return coreRole === "lecturer" || coreRole === "staff" || coreRole === "admin";
}

export function roleBadgeClass(coreRole: string | undefined): string {
  return `rounded-full px-2.5 py-1 text-label-sm ${
    isStaffRole(coreRole)
      ? "bg-primary-container/10 text-primary-container"
      : "bg-surface-variant text-on-surface-variant"
  }`;
}

export function can(profile: Pick<MyProfile, "permissions"> | null | undefined, permission: Permission): boolean {
  return profile?.permissions.includes(permission) ?? false;
}

/** ผู้ใช้ทำ action `:own` กับของตัวเอง หรือ `:any` กับของใครก็ได้ */
export function canOnResource(
  profile: Pick<MyProfile, "id" | "permissions"> | null | undefined,
  ownerId: string,
  own: Permission,
  any: Permission,
): boolean {
  if (!profile) return false;
  return can(profile, any) || (profile.id === ownerId && can(profile, own));
}

/**
 * ป้ายของผู้เขียน: รหัสบุคคลจาก Core Hub หรือบทบาทเมื่อบัญชีไม่ผูกกับบุคคล
 * ระบบนี้ไม่เก็บชื่อผู้ใช้ (reference-data.md ข้อ 8)
 */
export function authorLabel(person: { personCode: string | null; coreRole: string; isAssistant?: boolean }): string {
  if (person.isAssistant) return "ผู้ช่วย AI";
  return person.personCode ?? roleLabel(person.coreRole);
}

/** ป้ายบทบาทข้างชื่อผู้เขียน — ผู้ช่วย AI ไม่มีบทบาทของ Core Hub */
export function authorRoleLabel(person: { coreRole: string; isAssistant?: boolean }): string {
  return person.isAssistant ? "AI" : roleLabel(person.coreRole);
}

/** อักษรย่อ 1–2 ตัวสำหรับอวตาร */
export function initialsOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = Array.from(parts[0])[0] ?? "";
  const second = parts.length > 1 ? (Array.from(parts[1])[0] ?? "") : "";
  return (first + second).toUpperCase();
}
