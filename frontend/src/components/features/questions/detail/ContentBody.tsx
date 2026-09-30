import type { ReactNode } from "react";

// แสดงเนื้อหากระทู้/คำตอบ: ข้อความธรรมดา + `inline code` + บล็อก ```code``` พร้อมไฮไลต์แบบง่าย
// สร้างเป็น React node ทั้งหมด (ไม่ใช้ dangerouslySetInnerHTML)

const TOKEN =
  /(\/\/.*|\/\*[\s\S]*?\*\/)|((["'`]).*?\3)|\b(const|let|var|function|return|import|export|from|default|class|extends|new|if|else|try|catch|async|await|this|true|false|null)\b|\b(string|number|boolean|any|void|int|double|float|char|public|private|protected|static|interface)\b/g;

function highlight(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(code.slice(last, start));
    const [text, comment, str, , keyword] = match;
    const className = comment
      ? "italic text-on-primary/50"
      : str
        ? "italic text-surface-dim"
        : keyword
          ? "font-semibold text-primary-fixed"
          : "text-on-primary-container";
    nodes.push(
      <span key={start} className={className}>
        {text}
      </span>,
    );
    last = start + text.length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

function renderInlineCode(text: string): ReactNode[] {
  return text.split(/`([^`]+)`/g).map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded bg-surface-variant px-1.5 py-0.5 font-mono text-sm text-primary">
        {part}
      </code>
    ) : (
      part
    ),
  );
}

export default function ContentBody({ text, compact = false }: { text: string; compact?: boolean }) {
  if (!text) return null;
  const parts = text.split(/(```[a-z]*\n[\s\S]*?```)/g);
  return (
    <div className="max-w-none text-on-surface">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const lines = part.split("\n");
          const lang = lines[0].replace("```", "").trim() || "code";
          const code = lines.slice(1, lines.length - 1).join("\n");
          return (
            <div key={index} className="relative my-4">
              <div lang="en" className="absolute top-2 right-3 font-mono text-caption text-on-primary/60">
                {lang}
              </div>
              <pre className="overflow-x-auto rounded-lg bg-brand-navy p-4 pt-8 font-mono text-sm leading-relaxed text-surface-container">
                {highlight(code)}
              </pre>
            </div>
          );
        }
        return (
          <span
            key={index}
            className={`block whitespace-pre-line text-body-md text-on-surface ${compact ? "my-1" : "my-2"}`}
          >
            {renderInlineCode(part)}
          </span>
        );
      })}
    </div>
  );
}
