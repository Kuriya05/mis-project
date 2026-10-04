"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { btnSecondary, card } from "@/components/shared/classes";
import { RefreshIcon, SparklesIcon, SpinnerIcon, StarIcon } from "@/components/shared/icons";
import { CheckIcon } from "@/csmju";
import { api, errorMessage, unwrap } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { authorLabel, authorRoleLabel } from "@/lib/permissions";
import type { Activity, SuccessEnvelope } from "@/lib/types";

// กิจกรรมของฉัน: คำตอบที่เพื่อน อาจารย์ และผู้ช่วย AI เขียนในกระทู้ของเรา (GET /api/v1/profiles/me/activity)
// ของใหม่มีจุดสีน้ำเงิน · กด "อ่านแล้วทั้งหมด" ให้นับใหม่ตั้งแต่ตอนนี้
export default function ActivityFeed() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      setActivity(unwrap(await api.get<SuccessEnvelope<Activity>>("/api/v1/profiles/me/activity")));
    } catch (err) {
      setError(errorMessage(err, "โหลดกิจกรรมไม่สำเร็จ"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markSeen = async () => {
    setMarking(true);
    try {
      await api.post("/api/v1/profiles/me/activity/seen");
      await load();
    } catch (err) {
      setError(errorMessage(err, "บันทึกไม่สำเร็จ"));
    } finally {
      setMarking(false);
    }
  };

  return (
    <section id="activity" aria-labelledby="activity-heading" className={`${card} max-w-2xl fade-slide-up stagger-2`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 px-6 py-4">
        <h2 id="activity-heading" className="flex items-center gap-2 font-display text-body-lg font-semibold text-on-surface">
          กิจกรรมในกระทู้ของฉัน
          {activity && activity.unreadCount > 0 && (
            <span className="rounded-full bg-primary-container px-2 py-0.5 text-label-sm text-on-primary tabular-nums">
              ใหม่ {activity.unreadCount}
            </span>
          )}
        </h2>
        {activity && activity.unreadCount > 0 && (
          <button type="button" onClick={markSeen} disabled={marking} aria-busy={marking} className={btnSecondary}>
            {marking ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />} อ่านแล้วทั้งหมด
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 px-6 py-4 text-body-md text-error">
          {error}
          <button type="button" onClick={() => void load()} className={btnSecondary}>
            <RefreshIcon className="h-4 w-4" /> ลองอีกครั้ง
          </button>
        </div>
      )}

      {!activity && !error && (
        <p role="status" className="flex items-center gap-2 px-6 py-6 text-body-md text-on-surface-variant">
          <SpinnerIcon className="h-4 w-4 animate-spin" /> กำลังโหลดกิจกรรม...
        </p>
      )}

      {activity && activity.items.length === 0 && (
        <p className="px-6 py-8 text-center text-body-md text-on-surface-variant">
          ยังไม่มีใครตอบกระทู้ของคุณ — เมื่อมีคำตอบใหม่จะขึ้นที่นี่
        </p>
      )}

      {activity && activity.items.length > 0 && (
        <ul className="divide-y divide-outline-variant/40">
          {activity.items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/questions/${item.questionId}`}
                className="flex gap-3 px-6 py-4 transition-colors hover:bg-surface-container-low"
              >
                <span className="relative shrink-0">
                  <Avatar name={authorLabel(item.author)} size="sm" />
                  {item.isNew && (
                    <span
                      aria-label="ใหม่"
                      className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-x-2 text-label-md text-on-surface">
                    {authorLabel(item.author)}
                    <span className="text-caption text-secondary">
                      {item.author.isAssistant ? (
                        <span className="inline-flex items-center gap-1">
                          <SparklesIcon className="h-3 w-3" /> ผู้ช่วย AI ตอบ
                        </span>
                      ) : item.kind === "answer" ? (
                        `${authorRoleLabel(item.author)} ตอบกระทู้ของคุณ`
                      ) : (
                        `${authorRoleLabel(item.author)} ตอบกลับ`
                      )}
                    </span>
                    {item.isVerified && (
                      <span className="inline-flex items-center gap-1 text-caption text-emerald-700">
                        <StarIcon className="h-3 w-3 fill-success text-success" /> ยืนยันแล้ว
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-label-sm text-primary-container">{item.questionTitle}</span>
                  <span className="line-clamp-2 block text-label-sm font-normal text-on-surface-variant">{item.excerpt}</span>
                  <time dateTime={item.createdAt} className="block text-caption text-secondary">
                    {formatRelative(item.createdAt)}
                  </time>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
