import { scrollbarHide } from "@/components/shared/classes";
import { SparklesIcon } from "@/components/shared/icons";
import { AI_SUGGESTIONS, DEFAULT_QUICK_REPLIES } from "@/lib/academic-bot";

const chip =
  "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-label-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40";

/** ปุ่มตัวเลือกด่วน (ข้อมูลที่เตรียมไว้) และตัวอย่างคำถามให้ผู้ช่วย AI แสดงเสมอเหนือช่องพิมพ์ */
export default function QuickReplies({
  disabled,
  onSend,
  className = "",
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`${scrollbarHide} flex shrink-0 gap-2 overflow-x-auto`}>
        {DEFAULT_QUICK_REPLIES.map((reply) => (
          <button
            type="button"
            key={reply}
            disabled={disabled}
            onClick={() => onSend(reply)}
            className={`${chip} border-outline-variant bg-surface text-on-surface-variant hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-primary-container`}
          >
            {reply.replace(/^\[|\]$/g, "")}
          </button>
        ))}
      </div>
      <div className={`${scrollbarHide} flex shrink-0 items-center gap-2 overflow-x-auto`} aria-label="ตัวอย่างคำถามให้ผู้ช่วย AI">
        <span className="flex shrink-0 items-center gap-1 text-label-sm text-primary-container">
          <SparklesIcon className="h-3.5 w-3.5" /> ถาม AI
        </span>
        {AI_SUGGESTIONS.map((question) => (
          <button
            type="button"
            key={question}
            disabled={disabled}
            onClick={() => onSend(question)}
            className={`${chip} border-primary-container/20 bg-primary-container/5 text-primary-container hover:bg-primary-container/15`}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
