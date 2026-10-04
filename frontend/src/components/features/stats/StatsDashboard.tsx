"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { btnSecondary, card } from "@/components/shared/classes";
import { AwardIcon, RefreshIcon, SparklesIcon, SpinnerIcon, StarIcon } from "@/components/shared/icons";
import { api, errorMessage, unwrap } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/format";
import { authorLabel, authorRoleLabel, roleBadgeClass } from "@/lib/permissions";
import type { BoardStats, SuccessEnvelope } from "@/lib/types";

// ภาพรวมของกระดาน (GET /api/v1/stats): ยอดรวม · กระทู้/คำตอบรายสัปดาห์ · แท็กยอดนิยม · ผู้ช่วยตอบดีเด่น
// กราฟใช้สีเดียว (primary-container) ต่อกราฟ — แยกกระทู้กับคำตอบเป็นสองกราฟ ไม่ใช้สองแกนในกราฟเดียว
// ผู้ช่วยตอบแสดงเป็นรหัสบุคคล ไม่มีชื่อ (reference-data.md ข้อ 8)

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${card} p-5`}>
      <p className="text-label-sm text-secondary">{label}</p>
      <p className="mt-1 font-display text-headline-md font-bold text-on-surface tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-caption text-on-surface-variant">{hint}</p>}
    </div>
  );
}

/** กราฟแท่งแนวตั้งหนึ่งชุดข้อมูล: แท่งบาง มุมบนมน 4px ห่างกัน 2px ชี้แล้วเห็นค่า */
function WeeklyBars({ title, unit, points }: { title: string; unit: string; points: { label: string; value: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((sum, p) => sum + p.value, 0);
  return (
    <figure className={`${card} p-5`}>
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-label-md text-on-surface">{title}</span>
        <span className="text-caption text-secondary">8 สัปดาห์ล่าสุด · รวม {formatNumber(total)} {unit}</span>
      </figcaption>
      <div className="mt-4 flex h-36 items-end gap-0.5 border-b border-outline-variant/60" aria-hidden="true">
        {points.map((p) => (
          <div key={p.label} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t bg-primary-container transition-opacity group-hover:opacity-80"
              style={{ height: `${(p.value / max) * 100}%`, minHeight: p.value > 0 ? 4 : 0 }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-on-surface px-2 py-1 text-caption text-on-primary shadow-md group-hover:block">
              {p.label}: {formatNumber(p.value)} {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-caption text-secondary" aria-hidden="true">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
      {/* ตารางสำหรับโปรแกรมอ่านหน้าจอ — กราฟเป็นภาพอย่างเดียว */}
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">สัปดาห์เริ่ม</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<BoardStats | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setStats(unwrap(await api.get<SuccessEnvelope<BoardStats>>("/api/v1/stats")));
    } catch (err) {
      setError(errorMessage(err, "โหลดสถิติไม่สำเร็จ"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <div role="alert" className={`${card} flex flex-wrap items-center justify-between gap-3 p-6 text-body-md text-error`}>
        {error}
        <button type="button" onClick={() => void load()} className={btnSecondary}>
          <RefreshIcon className="h-4 w-4" /> ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <p role="status" className="flex items-center gap-2 text-body-md text-on-surface-variant">
        <SpinnerIcon className="h-4 w-4 animate-spin" /> กำลังโหลดสถิติ...
      </p>
    );
  }

  const { totals } = stats;
  const resolvedRate = totals.questions === 0 ? 0 : Math.round((totals.resolved / totals.questions) * 100);
  const week = (iso: string) => formatDate(iso);
  const maxTag = Math.max(1, ...stats.topTags.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 fade-slide-up">
        <StatTile label="กระทู้ทั้งหมด" value={formatNumber(totals.questions)} />
        <StatTile label="แก้ไขแล้ว" value={`${resolvedRate}%`} hint={`${formatNumber(totals.resolved)} กระทู้มีคำตอบที่ยืนยัน`} />
        <StatTile label="คำตอบจากเพื่อนและอาจารย์" value={formatNumber(totals.answers)} />
        <StatTile label="คำตอบจากผู้ช่วย AI" value={formatNumber(totals.assistantAnswers)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 fade-slide-up stagger-1">
        <WeeklyBars
          title="กระทู้ใหม่รายสัปดาห์"
          unit="กระทู้"
          points={stats.weekly.map((w) => ({ label: week(w.weekStart), value: w.questions }))}
        />
        <WeeklyBars
          title="คำตอบจากคนรายสัปดาห์"
          unit="คำตอบ"
          points={stats.weekly.map((w) => ({ label: week(w.weekStart), value: w.answers }))}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 fade-slide-up stagger-2">
        <section aria-labelledby="top-tags" className={`${card} p-5`}>
          <h2 id="top-tags" className="text-label-md text-on-surface">แท็กยอดนิยม</h2>
          {stats.topTags.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">ยังไม่มีแท็ก</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.topTags.map((tag) => (
                <li key={tag.name}>
                  <Link
                    href={`/questions?tag=${encodeURIComponent(tag.name)}`}
                    className="group flex items-center gap-3 rounded-lg px-1 py-0.5 hover:bg-surface-container-low"
                  >
                    <span className="w-28 shrink-0 truncate text-label-sm text-on-surface group-hover:text-primary-container">
                      #{tag.name}
                    </span>
                    <span className="h-3 flex-1 rounded-r bg-surface-container">
                      <span
                        className="block h-3 rounded-r bg-primary-container"
                        style={{ width: `${(tag.count / maxTag) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-label-sm text-secondary tabular-nums">{tag.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="top-helpers" className={`${card} p-5`}>
          <h2 id="top-helpers" className="flex items-center gap-2 text-label-md text-on-surface">
            <AwardIcon className="h-4 w-4 text-primary-container" /> ผู้ช่วยตอบดีเด่น
          </h2>
          <p className="mt-1 text-caption text-secondary">เรียงตามคำตอบที่ได้รับการยืนยัน แล้วตามจำนวนคำตอบ (ไม่นับผู้ช่วย AI)</p>
          {stats.topHelpers.length === 0 ? (
            <p className="mt-4 text-body-md text-on-surface-variant">ยังไม่มีใครตอบ — มาเป็นคนแรกที่ช่วยเพื่อนกัน</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {stats.topHelpers.map((helper, index) => (
                <li key={helper.author.id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-display text-label-md text-secondary tabular-nums">{index + 1}</span>
                  <Avatar name={authorLabel(helper.author)} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label-md text-on-surface">{authorLabel(helper.author)}</span>
                    <span className={`inline-block ${roleBadgeClass(helper.author.coreRole)}`}>{authorRoleLabel(helper.author)}</span>
                  </span>
                  <span className="text-right text-caption text-secondary">
                    <span className="flex items-center justify-end gap-1 text-label-sm text-emerald-700">
                      <StarIcon className="h-3.5 w-3.5 fill-success text-success" /> {helper.verifiedAnswers} ยืนยัน
                    </span>
                    {helper.answers} คำตอบ
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <p className="flex items-center gap-1 text-caption text-secondary">
        <SparklesIcon className="h-3.5 w-3.5" /> ผู้ช่วย AI ตอบทุกกระทู้ใหม่เป็นคำตอบแรก — "คำตอบจากคน" นับเฉพาะเพื่อนและอาจารย์
      </p>
    </div>
  );
}
