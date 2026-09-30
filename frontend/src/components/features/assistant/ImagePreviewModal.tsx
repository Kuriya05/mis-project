"use client";

import Image from "next/image";
import { useEffect, useId } from "react";
import { btnTonal, iconRound } from "@/components/shared/classes";
import { ExternalLinkIcon } from "@/components/shared/icons";
import { CloseIcon } from "@/csmju";
import type { PreviewImage } from "@/lib/academic-bot";

/** หน้าต่างดูรูปขนาดใหญ่ (กด Esc หรือคลิกนอกกรอบเพื่อปิด) */
export default function ImagePreviewModal({
  image,
  onClose,
}: {
  image: PreviewImage;
  onClose: () => void;
}) {
  const titleId = useId();
  const title = image.title || "ดูรูปภาพ";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* ฉากหลังเป็นปุ่ม (ไม่ใช่ div onClick) — คีย์บอร์ดใช้ปุ่มปิดหรือ Esc แทน จึงไม่ต้องรับ focus */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="ปิดหน้าต่างดูรูป"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="fade-slide-up relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/40 px-6 py-4">
          <h2 id={titleId} className="truncate text-label-md text-on-surface">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <a href={image.url} target="_blank" rel="noopener noreferrer" className={btnTonal}>
              เปิดแท็บใหม่ <ExternalLinkIcon className="h-4 w-4" />
            </a>
            <button type="button" onClick={onClose} className={iconRound} aria-label="ปิด" autoFocus>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex max-h-[calc(92vh-4.5rem)] items-center justify-center overflow-auto bg-surface p-4">
          <Image
            src={image.url}
            alt={title}
            width={image.width}
            height={image.height}
            sizes="(min-width: 896px) 56rem, 100vw"
            className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
}
