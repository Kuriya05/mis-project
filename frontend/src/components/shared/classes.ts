import {
  cardClass,
  dangerButtonClass,
  iconButtonClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/csmju";

// class ของระบบนี้ ประกอบจาก ui.ts ของ design system + token ใน globals.css เท่านั้น
// (ห้ามเขียน CSS เอง และห้ามแก้ globals.css — ui-design-system.md ข้อ 16.0, 17.0)

const pressable = "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40";
const touchTarget = "max-md:min-h-11";

/** ปุ่มหลัก — 1 ปุ่มต่อพื้นที่ */
export const btnPrimary = `${primaryButtonClass} ${pressable} ${touchTarget}`;

/** ปุ่มรอง */
export const btnSecondary = `${secondaryButtonClass} inline-flex items-center justify-center gap-2 ${pressable} ${touchTarget}`;

/** ปุ่ม tonal (พื้นสีอ่อนของ primary) */
export const btnTonal = `inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container/10 px-4 py-2.5 text-label-md text-primary-container transition-colors hover:bg-primary-container/20 ${pressable}`;

/** ปุ่มยืนยันการลบ */
export const btnDanger = `${dangerButtonClass} inline-flex items-center justify-center gap-2 cursor-pointer ${touchTarget}`;

/** ปุ่มไอคอนในแถว */
export const iconBtn = `${iconButtonClass} inline-flex items-center justify-center rounded-lg ${pressable}`;

/** ปุ่มไอคอนวงกลม */
export const iconRound = `inline-flex items-center justify-center rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-variant/50 ${pressable}`;

/** การ์ดมาตรฐาน */
export const card = cardClass;

/** ช่องกรอก */
export const input = inputClass;

/** กล่องที่ครอบ input หลายชิ้น (ช่องแชท / editor) ให้ focus เหมือนช่องกรอก */
export const inputShell =
  "rounded-lg border border-outline-variant bg-surface-container-lowest transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20";

/** หัวกลุ่มเมนู */
export const navHeading = "px-3 pt-2 pb-2 text-label-sm text-on-surface-variant";

/** ซ่อน scrollbar (แถบเลื่อนแนวนอน) */
export const scrollbarHide = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
