// รูปแบบแสดงผลวันที่ / เวลา / ตัวเลข (ui-design-system.md ข้อ 11.3)
// พ.ศ. เป็นค่าเริ่มต้น และตรึง timezone ที่ Asia/Bangkok เสมอ
// ช่วงเปลี่ยนผ่าน: design system ยังไม่มี util เหล่านี้ จึงเป็น local util ชั่วคราว (ข้อ 17.0)

const TIME_ZONE = "Asia/Bangkok";
const LOCALE = "th-TH-u-ca-buddhist";

type DateInput = string | number | Date;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

const shortDate = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "short", year: "numeric" });
const longDate = new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, day: "numeric", month: "long", year: "numeric" });
const timeOnly = new Intl.DateTimeFormat("th-TH", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
const numberFormat = new Intl.NumberFormat("th-TH");

/** `11 ส.ค. 2569` หรือ `11 สิงหาคม 2569` */
export function formatDate(value: DateInput, style: "short" | "long" = "short"): string {
  return (style === "long" ? longDate : shortDate).format(toDate(value));
}

/** `09:30 น.` */
export function formatTime(value: DateInput): string {
  return `${timeOnly.format(toDate(value))} น.`;
}

/** `11 ส.ค. 2569 09:30 น.` */
export function formatDateTime(value: DateInput): string {
  return `${formatDate(value)} ${formatTime(value)}`;
}

/** `3 ชั่วโมงที่แล้ว` — ใช้เฉพาะ ≤ 7 วัน เกินนั้นแสดงวันที่ */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "เมื่อสักครู่";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return `${days} วันที่แล้ว`;
  return formatDate(date);
}

/** `2,450` */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/**
 * `0812345678` → `081-234-5678` · `053873890` → `053-873890`
 * ค่าที่มีขีดอยู่แล้ว (เช่นช่วงเบอร์ `053-873890-3`) แสดงตามเดิม
 */
export function formatPhone(value: string): string {
  if (!/^\d+$/.test(value)) return value;
  if (value.length === 10) return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
  if (value.length === 9) return `${value.slice(0, 3)}-${value.slice(3)}`;
  return value;
}
