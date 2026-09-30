"use client";

import { useId } from "react";
import { btnPrimary, btnSecondary, input } from "@/components/shared/classes";
import { SpinnerIcon } from "@/components/shared/icons";
import { CheckIcon } from "@/csmju";

// กล่องแก้ไขข้อความแบบ inline (คำตอบ / ข้อความตอบกลับ)
export default function InlineEditor({
  value,
  onChange,
  onSubmit,
  onCancel,
  saving,
  error,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  rows?: number;
}) {
  const errorId = useId();
  return (
    <form onSubmit={onSubmit} className="fade-slide-up space-y-3">
      <textarea
        autoFocus
        aria-label="แก้ไขข้อความ"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`${input} resize-y p-3 font-mono ${error ? "input-error" : ""}`}
      />
      {error && (
        <p id={errorId} role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={saving} className={btnSecondary}>
          ยกเลิก
        </button>
        <button type="submit" disabled={saving || !value.trim()} aria-busy={saving} className={btnPrimary}>
          {saving ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />} บันทึก
        </button>
      </div>
    </form>
  );
}
