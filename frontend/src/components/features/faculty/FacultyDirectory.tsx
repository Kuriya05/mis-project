"use client";

import { useEffect, useMemo, useState } from "react";
import { GroupIcon, SchoolIcon, SearchIcon } from "@/csmju";
import { btnSecondary, card, input } from "@/components/shared/classes";
import { AwardIcon, LayersIcon } from "@/components/shared/icons";
import {
  EXPERTISE_AREAS,
  EXPERTISE_AREA_KEYS,
  FACULTY,
  FACULTY_SOURCE_URL,
  FACULTY_UPDATED_AT,
  type ExpertiseArea,
} from "@/data/faculty";
import { useSession } from "@/components/shared/SessionProvider";
import { api, unwrap } from "@/lib/api";
import { questionsForLecturer } from "@/lib/faculty-match";
import { formatNumber } from "@/lib/format";
import type { QuestionSummary, SuccessEnvelope } from "@/lib/types";
import ExpertiseChart, { type AreaCount } from "./ExpertiseChart";
import FacultyCard from "./FacultyCard";
import ProgramContactCard from "./ProgramContactCard";
import StatTile from "./StatTile";

// ข้อมูลเป็น static ทั้งหมด จึงคำนวณครั้งเดียวระดับ module
// จำนวนอาจารย์ในแต่ละด้าน เรียงจากมากไปน้อย
const AREA_COUNTS: AreaCount[] = EXPERTISE_AREA_KEYS.map((key) => ({
  key,
  label: EXPERTISE_AREAS[key],
  count: FACULTY.filter((p) => p.areas.includes(key)).length,
})).sort((a, b) => b.count - a.count);

const STATS = {
  total: FACULTY.length,
  asstProf: FACULTY.filter((p) => p.position === "ผู้ช่วยศาสตราจารย์").length,
  doctorate: FACULTY.filter((p) => p.prefix.includes("ดร.")).length,
  areas: EXPERTISE_AREA_KEYS.length,
};

export default function FacultyDirectory() {
  const [query, setQuery] = useState("");
  const [activeArea, setActiveArea] = useState<ExpertiseArea | null>(null);
  const { can } = useSession();
  const canAsk = can("question:create");

  // กระทู้ล่าสุด 100 กระทู้ ไว้จับคู่กับความถนัดของอาจารย์แต่ละท่าน · โหลดไม่ได้ก็แค่ไม่แสดงส่วนนี้
  const [questions, setQuestions] = useState<QuestionSummary[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    api
      .get<SuccessEnvelope<QuestionSummary[]>>("/api/v1/questions", { params: { limit: 100 } })
      .then((res) => {
        if (!cancelled) setQuestions(unwrap(res));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACULTY.filter((p) => {
      if (activeArea && !p.areas.includes(activeArea)) return false;
      if (!q) return true;
      const haystack = [p.nameTh, p.nameEn, p.prefix, ...p.expertise, ...p.areas.map((a) => EXPERTISE_AREAS[a])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeArea]);

  const clearFilters = () => {
    setQuery("");
    setActiveArea(null);
  };

  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-on-surface-variant">
        ข้อมูลจาก{" "}
        <a
          href={FACULTY_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-container hover:underline"
        >
          csmju.com
        </a>{" "}
        (อัปเดต {FACULTY_UPDATED_AT})
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={GroupIcon} label="อาจารย์ประจำสาขา" value={STATS.total} />
        <StatTile icon={AwardIcon} label="ผู้ช่วยศาสตราจารย์" value={STATS.asstProf} />
        <StatTile icon={SchoolIcon} label="วุฒิปริญญาเอก" value={STATS.doctorate} />
        <StatTile icon={LayersIcon} label="ด้านความเชี่ยวชาญ" value={STATS.areas} />
      </div>

      {/* Expertise chart + contact */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <ExpertiseChart areaCounts={AREA_COUNTS} activeArea={activeArea} onSelectArea={setActiveArea} />
        <ProgramContactCard />
      </div>

      {/* Search + active filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-outline" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="ค้นหาอาจารย์"
            placeholder="ค้นหาชื่ออาจารย์ หรือความเชี่ยวชาญ เช่น Machine Learning, IoT, ฐานข้อมูล..."
            className={`${input} pl-10`}
          />
        </div>
        <div className="shrink-0 text-sm text-on-surface-variant" aria-live="polite">
          แสดง <span className="font-semibold text-on-surface tabular-nums">{formatNumber(filtered.length)}</span>{" "}
          จาก {formatNumber(FACULTY.length)} ท่าน
          {activeArea && (
            <>
              {" "}
              · ด้าน <span className="font-semibold text-primary-container">{EXPERTISE_AREAS[activeArea]}</span>
            </>
          )}
        </div>
      </div>

      {/* Faculty grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((person) => (
            <FacultyCard
              key={person.id}
              person={person}
              activeArea={activeArea}
              onSelectArea={setActiveArea}
              related={questions && questionsForLecturer(person, questions)}
              canAsk={canAsk}
            />
          ))}
        </div>
      ) : (
        <div className={`${card} mx-auto max-w-md px-6 py-12 text-center`}>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
            <SearchIcon className="h-6 w-6" />
          </div>
          <h2 className="font-display text-body-lg font-semibold text-on-surface">ไม่พบอาจารย์ที่ตรงกับการค้นหา</h2>
          <p className="mt-2 text-body-md text-on-surface-variant">ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองด้านความเชี่ยวชาญ</p>
          <button type="button" onClick={clearFilters} className={`${btnSecondary} mt-6`}>
            ล้างตัวกรอง
          </button>
        </div>
      )}
    </div>
  );
}
