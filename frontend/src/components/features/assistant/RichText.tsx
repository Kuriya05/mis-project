import type { ReactNode } from "react";

// แสดงคำตอบของบอทแบบ markdown ย่อ: **ตัวหนา** · `โค้ดสั้น` · ```บล็อกโค้ด``` (คำตอบของผู้ช่วย AI มีโค้ดได้)
// ส่วนอื่นแสดงเป็นข้อความธรรมดา — ไม่แปลง HTML จึงไม่มีช่องให้ข้อความของ AI ฝังสคริปต์

const FENCE = /(```[^\n`]*\n[\s\S]*?```)/g;

function inline(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`\n]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${key}-${i}`} className="font-semibold text-on-surface">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={`${key}-${i}`} className="rounded bg-surface-variant px-1.5 py-0.5 font-mono text-label-sm text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(FENCE).map((part, i) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0].trim();
          const code = lines.slice(1).join("\n").replace(/\n$/, "");
          return (
            <span key={i} className="relative my-2 block">
              {lang && (
                <span lang="en" className="absolute top-1.5 right-3 font-mono text-caption text-on-primary/60">
                  {lang}
                </span>
              )}
              <pre className="overflow-x-auto whitespace-pre rounded-lg bg-brand-navy p-3 pt-6 font-mono text-caption leading-relaxed text-surface-container">
                <code>{code}</code>
              </pre>
            </span>
          );
        }
        return <span key={i}>{inline(part, String(i))}</span>;
      })}
    </>
  );
}
