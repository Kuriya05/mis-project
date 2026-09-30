// สีของแท็กที่ใช้ร่วมกันทั้งหน้ารวมกระทู้และหน้ารายละเอียดกระทู้
// แท็กยอดฮิตใช้ tag แบบเน้น (primary tint) ส่วนแท็กอื่นใช้ tag ปกติ (เทา) ตาม ui-design-system.md ข้อ 7.2.1
const HIGHLIGHTED_TAGS = new Set(["Curriculum", "Database", "Error", "React", "Java", "NestJS"]);

export const DEFAULT_HOT_TAGS = ["Curriculum", "Java", "Database", "Error", "NestJS", "React"];

export function tagClass(tag: string): string {
  return `inline-flex items-center rounded-full px-2.5 py-1 text-label-sm ${
    HIGHLIGHTED_TAGS.has(tag)
      ? "bg-primary-container/10 text-primary-container"
      : "bg-surface-variant text-on-surface-variant"
  }`;
}
