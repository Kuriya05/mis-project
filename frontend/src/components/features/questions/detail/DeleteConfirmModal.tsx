"use client";

import { btnDanger, btnSecondary } from "@/components/shared/classes";
import { SpinnerIcon } from "@/components/shared/icons";
import { DeleteIcon, Modal } from "@/csmju";

// ยืนยันก่อนลบ: ระหว่างลบ (busy) ปิดกล่องไม่ได้และกดซ้ำไม่ได้ · ลบไม่สำเร็จแสดง error ในกล่อง
export default function DeleteConfirmModal({
  title,
  message,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const close = () => {
    if (!busy) onCancel();
  };
  return (
    <Modal title={title} onClose={close}>
      <p className="text-body-md text-on-surface-variant">{message}</p>
      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {error}
        </div>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={close} disabled={busy} className={btnSecondary}>
          ยกเลิก
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} aria-busy={busy} className={btnDanger}>
          {busy ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <DeleteIcon className="h-4 w-4" />} ลบ
        </button>
      </div>
    </Modal>
  );
}
