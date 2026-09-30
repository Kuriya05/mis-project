import { inputShell } from "@/components/shared/classes";
import { SendIcon } from "@/components/shared/icons";

/** ช่องพิมพ์คำถาม + ปุ่มส่ง (กด Enter เพื่อส่ง) */
export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  /** บอทกำลังตอบ */
  disabled: boolean;
  placeholder: string;
  compact?: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend(value);
      }}
      className={`${inputShell} flex items-center gap-1 ${compact ? "py-1 pl-2.5 pr-1" : "py-1.5 pl-3 pr-1.5"}`}
    >
      <input
        type="text"
        aria-label="พิมพ์คำถาม"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-1.5 py-2 text-body-md text-on-surface placeholder:text-outline/70 focus:outline-hidden"
      />
      <button
        type="submit"
        disabled={!value.trim() || disabled}
        aria-label="ส่งข้อความ"
        className={`btn-gradient flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-on-primary shadow-md transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${
          compact ? "h-10 w-10" : "h-11 w-11 md:h-10 md:w-10"
        }`}
      >
        <SendIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </button>
    </form>
  );
}
