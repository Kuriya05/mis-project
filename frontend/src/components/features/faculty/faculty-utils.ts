import { formatPhone } from "@/lib/format";

/**
 * "053-873890-93 ต่อ 21" -> "tel:053873890" (ใช้เบอร์แรกของช่วงเบอร์สำหรับโทรออก)
 * คืน null ถ้าหาเบอร์ที่โทรได้ไม่เจอ
 */
export function telHref(phone: string): string | null {
  const match = phone.match(/0\d{2}-?\d{6,7}/);
  return match ? `tel:${match[0].replace(/-/g, "")}` : null;
}

/**
 * จัดรูปแบบเบอร์ด้วย formatPhone ของระบบ — ส่วน "ต่อ xx" แยกออกก่อนแล้วต่อท้ายกลับ
 * (เบอร์ช่วงอย่าง "053-873890-93" ไม่ใช่เบอร์เดี่ยว formatPhone จะคืนค่าเดิม)
 */
export function displayPhone(phone: string): string {
  const [main, ext] = phone.split(/\s*ต่อ\s*/);
  const formatted = formatPhone(main);
  return ext ? `${formatted} ต่อ ${ext}` : formatted;
}
