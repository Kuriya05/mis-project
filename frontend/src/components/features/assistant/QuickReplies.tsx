import { scrollbarHide } from "@/components/shared/classes";
import { DEFAULT_QUICK_REPLIES } from "@/lib/academic-bot";

/** ปุ่มตัวเลือกด่วน แสดงเสมอเหนือช่องพิมพ์ */
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
    <div className={`${scrollbarHide} flex shrink-0 gap-2 overflow-x-auto ${className}`}>
      {DEFAULT_QUICK_REPLIES.map((reply) => (
        <button
          type="button"
          key={reply}
          disabled={disabled}
          onClick={() => onSend(reply)}
          className="shrink-0 cursor-pointer rounded-full border border-outline-variant bg-surface px-3 py-1.5 text-label-sm text-on-surface-variant transition-colors duration-150 hover:border-primary-container/30 hover:bg-primary-container/10 hover:text-primary-container disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reply.replace(/^\[|\]$/g, "")}
        </button>
      ))}
    </div>
  );
}
