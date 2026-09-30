import { BotAvatar } from "./ChatArt";

/** จุดสามจุดระหว่างบอทกำลังพิมพ์คำตอบ */
export default function TypingIndicator({ compact = false }: { compact?: boolean }) {
  return (
    <div className="fade-slide-up flex items-start gap-3" role="status" aria-label="กำลังพิมพ์คำตอบ">
      <BotAvatar size={compact ? "sm" : "md"} />
      <div className="flex gap-1 rounded-xl rounded-tl-sm border border-outline-variant/40 bg-surface-container-lowest px-4 py-4 shadow-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-outline" />
        <span className="stagger-1 h-2 w-2 animate-pulse rounded-full bg-outline" />
        <span className="stagger-2 h-2 w-2 animate-pulse rounded-full bg-outline" />
      </div>
    </div>
  );
}
