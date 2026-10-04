"use client";

import Link from "next/link";
import { useState } from "react";
import { btnSecondary, btnTonal } from "@/components/shared/classes";
import { SparklesIcon, SpinnerIcon } from "@/components/shared/icons";
import { AddIcon, CheckIcon, DescriptionIcon } from "@/csmju";
import { api, unwrap } from "@/lib/api";
import type { QuestionSummary, SuccessEnvelope } from "@/lib/types";

interface Draft {
  title: string;
  tips: string[];
  tags: string[];
  keywords: string[];
}

// ผู้ช่วย AI ช่วยเรียบเรียงคำถามก่อนโพสต์ (POST /assistant/draft) และหากระทู้ที่เคยถามเรื่องเดียวกัน
// ผู้ใช้เลือกเองว่าจะใช้หัวข้อ/แท็กที่แนะนำหรือไม่ — AI ไม่แก้ฟอร์มเอง
export default function AiDraftHelper({
  title,
  body,
  tags,
  existingTags,
  onUseTitle,
  onAddTag,
}: {
  title: string;
  body: string;
  tags: string[];
  existingTags: string[];
  onUseTitle: (title: string) => void;
  onAddTag: (tag: string) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [similar, setSimilar] = useState<QuestionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canAsk = (title.trim() || body.trim()).length > 0;
  const hasTag = (tag: string) => tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  const askAi = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/assistant/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body, tags, existingTags }),
      });
      if (!res.ok) {
        setError(
          res.status === 429
            ? "ขอคำแนะนำถี่เกินไป รอสักครู่แล้วลองอีกครั้ง"
            : "ผู้ช่วย AI ไม่พร้อมใช้งานชั่วคราว ลองอีกครั้งภายหลัง",
        );
        return;
      }
      const next = ((await res.json()) as SuccessEnvelope<Draft>).data;
      setDraft(next);

      // กระทู้ที่เคยถามเรื่องเดียวกัน: ค้นด้วยคำค้นที่ AI แนะนำ รวมไม่ซ้ำ ไม่เกิน 5 กระทู้
      const found = new Map<string, QuestionSummary>();
      for (const keyword of next.keywords.slice(0, 2)) {
        try {
          const page = unwrap(
            await api.get<SuccessEnvelope<QuestionSummary[]>>("/api/v1/questions", { params: { q: keyword, limit: 5 } }),
          );
          for (const q of page) found.set(q.id, q);
        } catch {
          // ค้นไม่ได้ก็แค่ไม่แสดงกระทู้ที่คล้ายกัน
        }
      }
      setSimilar([...found.values()].slice(0, 5));
    } catch {
      setError("ผู้ช่วย AI ไม่พร้อมใช้งานชั่วคราว ลองอีกครั้งภายหลัง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-labelledby="ai-draft-heading"
      className="space-y-4 rounded-xl border border-primary-container/20 bg-primary-container/5 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="ai-draft-heading" className="flex items-center gap-2 text-label-md text-primary-container">
            <SparklesIcon className="h-4 w-4" /> ให้ AI ช่วยปรับคำถาม
          </h3>
          <p className="text-caption text-secondary">หัวข้อที่ชัดขึ้น สิ่งที่ควรเพิ่ม แท็ก และกระทู้ที่เคยถามแล้ว</p>
        </div>
        <button type="button" onClick={askAi} disabled={!canAsk || loading} aria-busy={loading} className={btnTonal}>
          {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
          {draft ? "ขอคำแนะนำใหม่" : "ขอคำแนะนำ"}
        </button>
      </div>

      {!canAsk && <p className="text-caption text-secondary">พิมพ์หัวข้อหรือรายละเอียดก่อน แล้วค่อยกดขอคำแนะนำ</p>}
      {error && (
        <p role="alert" className="text-label-sm text-error">
          {error}
        </p>
      )}

      {draft && (
        <div className="space-y-4" aria-live="polite">
          {draft.title && draft.title !== title.trim() && (
            <div className="space-y-2">
              <p className="text-label-sm text-on-surface">หัวข้อที่แนะนำ</p>
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2">
                <span className="flex-1 text-body-md text-on-surface">{draft.title}</span>
                <button type="button" onClick={() => onUseTitle(draft.title)} className={btnSecondary}>
                  <CheckIcon className="h-4 w-4" /> ใช้หัวข้อนี้
                </button>
              </div>
            </div>
          )}

          {draft.tips.length > 0 && (
            <div className="space-y-1">
              <p className="text-label-sm text-on-surface">เพิ่มสิ่งเหล่านี้ในรายละเอียด จะได้คำตอบเร็วขึ้น</p>
              <ul className="list-disc space-y-1 pl-5 text-label-md font-normal text-on-surface-variant">
                {draft.tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.tags.length > 0 && (
            <div className="space-y-2">
              <p className="text-label-sm text-on-surface">แท็กที่แนะนำ</p>
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) =>
                  hasTag(tag) ? (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-label-sm text-primary-container">
                      <CheckIcon className="h-3.5 w-3.5" /> #{tag}
                    </span>
                  ) : (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onAddTag(tag)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary-container/30 bg-surface px-3 py-1 text-label-sm text-primary-container hover:bg-primary-container/10"
                    >
                      <AddIcon className="h-3.5 w-3.5" /> #{tag}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <p className="text-label-sm text-on-surface">กระทู้ที่อาจถามเรื่องเดียวกัน</p>
            {similar.length === 0 ? (
              <p className="text-caption text-secondary">ไม่พบกระทู้ที่คล้ายกัน — โพสต์ได้เลย</p>
            ) : (
              <ul className="space-y-1">
                {similar.map((q) => (
                  <li key={q.id}>
                    <Link
                      href={`/questions/${q.id}`}
                      target="_blank"
                      className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-label-md text-primary-container hover:bg-primary-container/10"
                    >
                      <DescriptionIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {q.title} <span className="text-caption text-secondary">· {q.commentCount} คำตอบ</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
