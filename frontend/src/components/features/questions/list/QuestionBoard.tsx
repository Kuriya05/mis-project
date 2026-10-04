"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/shared/SessionProvider";
import { btnPrimary, btnSecondary, card, input } from "@/components/shared/classes";
import { AlertCircleIcon, RefreshIcon, SpinnerIcon } from "@/components/shared/icons";
import { CloseIcon, EditIcon, SearchIcon, Tabs, type TabItem } from "@/csmju";
import { api, errorMessage, unwrap } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { forumCache, loadQuestions, questionQueryKey, type QuestionPage, type QuestionQuery } from "@/lib/forum-cache";
import { DEFAULT_HOT_TAGS } from "@/lib/tags";
import type { QuestionSummary, SuccessEnvelope, Tag } from "@/lib/types";
import ActivityBanner from "./ActivityBanner";
import { type ForumFilters, type ForumTab, forumHref, sameFilters } from "./filters";
import QuestionCard from "./QuestionCard";
import QuestionListSkeleton from "./QuestionListSkeleton";

const FORUM_TABS: TabItem<ForumTab>[] = [
  { id: "all", label: "กระทู้ทั้งหมด" },
  { id: "mine", label: "กระทู้ของฉัน" },
  { id: "unanswered", label: "กระทู้รอคนตอบ" },
  { id: "resolved", label: "แก้ไขแล้ว" },
  { id: "popular", label: "ยอดนิยม" },
  { id: "saved", label: "ที่บันทึกไว้" },
];

/** เกินเวลานี้แล้วยังโหลดไม่เสร็จ ให้บอกผู้ใช้ว่าเซิร์ฟเวอร์ตอบช้า */
const SLOW_AFTER_MS = 4000;
const SEARCH_DEBOUNCE_MS = 300;

interface ForumResult {
  key: string | null;
  data: QuestionPage | null;
  error: unknown;
}

const EMPTY_RESULT: ForumResult = { key: null, data: null, error: null };

// กระดานกระทู้ (legacy Home.jsx viewMode === 'forum') — ตัวกรองทั้งหมดอยู่ใน URL
export default function QuestionBoard({ filters }: { filters: ForumFilters }) {
  const router = useRouter();
  const { can } = useSession();
  const canAsk = can("question:create");
  const canVote = can("question:vote");
  const canLoadSampleData = can("sample-data:load");

  const [tab, setTab] = useState<ForumTab>(filters.tab);
  const [selectedTag, setSelectedTag] = useState(filters.tag);
  const [searchQuery, setSearchQuery] = useState(filters.q);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.q);
  const [prevFilters, setPrevFilters] = useState(filters);

  const [result, setResult] = useState<ForumResult>(EMPTY_RESULT);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");
  const [hotTags, setHotTags] = useState<string[]>(DEFAULT_HOT_TAGS);

  const applied: ForumFilters = { tab, tag: selectedTag, q: debouncedSearch };
  // URL ที่หน้านี้ router.replace ไปเองและยังรอ server ส่ง props ใหม่กลับมา
  const pendingHrefs = useRef<string[]>([]);

  // URL เปลี่ยนจากภายนอก (เช่น กดเมนู "กระทู้ถามตอบ" หรือปุ่มย้อนกลับ) → ใช้ค่าจาก URL
  // ถ้าเป็นค่าที่หน้านี้เพิ่ง router.replace ไปเอง (หรือตรงกับตัวกรองปัจจุบันอยู่แล้ว) ไม่ต้องทำอะไร
  if (!sameFilters(filters, prevFilters)) {
    setPrevFilters(filters);
    const echoIndex = pendingHrefs.current.indexOf(forumHref(filters));
    if (echoIndex >= 0) pendingHrefs.current = pendingHrefs.current.slice(echoIndex + 1);
    else if (!sameFilters(filters, applied)) {
      setTab(filters.tab);
      setSelectedTag(filters.tag);
      setSearchQuery(filters.q);
      setDebouncedSearch(filters.q);
    }
  }

  // หน่วงการค้นหา 300ms เพื่อไม่ยิง request ทุกครั้งที่พิมพ์ตัวอักษร
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ให้ URL ตรงกับตัวกรองเสมอ (แชร์ลิงก์ / รีเฟรช / ย้อนกลับจากหน้ากระทู้แล้วได้ตัวกรองเดิม)
  const href = forumHref(applied);
  const urlHref = forumHref(filters);
  useEffect(() => {
    if (href === urlHref || pendingHrefs.current.includes(href)) return;
    pendingHrefs.current.push(href);
    router.replace(href, { scroll: false });
  }, [href, urlHref, router]);

  // แท็กยอดฮิตจริงจากฐานข้อมูล (เรียงตามจำนวนกระทู้)
  useEffect(() => {
    let cancelled = false;
    api
      .get<SuccessEnvelope<Tag[]>>("/api/v1/tags", { params: { limit: 8 } })
      .then((res) => {
        const names = unwrap(res).map((t) => t.name);
        if (!cancelled && names.length > 0) setHotTags(names);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // พารามิเตอร์ที่ส่งไป API (กรองฝั่งเซิร์ฟเวอร์ทั้งหมด)
  const queryParams = useMemo(() => {
    const params: QuestionQuery = {};
    if (debouncedSearch) params.q = debouncedSearch;
    if (selectedTag) params.tag = selectedTag;
    if (tab === "mine") params.mine = true;
    if (tab === "unanswered") params.unanswered = true;
    if (tab === "resolved") params.status = "RESOLVED";
    if (tab === "popular") params.sort = "popular";
    if (tab === "saved") params.bookmarked = true;
    return params;
  }, [debouncedSearch, selectedTag, tab]);
  const queryKey = questionQueryKey(queryParams);

  // แสดงข้อมูลจากเซิร์ฟเวอร์ถ้ามี ไม่งั้นใช้ cache ทันที
  const hasResult = result.key === queryKey;
  const page = (hasResult && result.data) || forumCache.get(queryKey) || null;
  const failed = hasResult && result.error !== null;
  const loading = seeding || (!page && !failed);
  const showError = !seeding && !page && failed;
  const slow = loading && slowKey === queryKey;
  const questions = page?.items ?? [];
  const total = page?.total ?? 0;

  // setState เฉพาะเมื่อได้ผลลัพธ์ หรือโหลดนานเกิน 4 วินาที
  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => setSlowKey(queryKey), SLOW_AFTER_MS);

    loadQuestions(queryParams)
      .then((data) => {
        if (!cancelled) setResult({ key: queryKey, data, error: null });
      })
      .catch((err: unknown) => {
        console.error("Error fetching questions:", err);
        if (!cancelled) setResult({ key: queryKey, data: null, error: err });
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [queryParams, queryKey, reloadKey]);

  const reload = () => {
    forumCache.clear();
    setResult(EMPTY_RESULT);
    setReloadKey((k) => k + 1);
  };

  // อัปเดตกระทู้ทั้งใน cache และบนหน้าจอ (ใช้กับการโหวต)
  const applyToForum = (fn: (q: QuestionSummary) => QuestionSummary) => {
    const mapPage = (p: QuestionPage): QuestionPage => ({ ...p, items: p.items.map(fn) });
    for (const [key, cached] of forumCache) forumCache.set(key, mapPage(cached));
    setResult((r) =>
      r.key === queryKey && r.data
        ? { ...r, data: mapPage(r.data) }
        : { key: queryKey, data: forumCache.get(queryKey) ?? { items: [], total: 0 }, error: null },
    );
  };

  // โหวตแบบ optimistic: อัปเดตหน้าจอทันที ไม่ต้องโหลดรายการกระทู้ใหม่ทั้งหมด
  const handleVote = async (question: QuestionSummary) => {
    const { id, hasVoted: wasVoted } = question;
    const toggleVote = (q: QuestionSummary) =>
      q.id !== id ? q : { ...q, hasVoted: !q.hasVoted, voteCount: q.voteCount + (q.hasVoted ? -1 : 1) };
    applyToForum(toggleVote);

    try {
      const url = `/api/v1/questions/${id}/votes`;
      type VoteResult = Pick<QuestionSummary, "voteCount" | "hasVoted">;
      const { voteCount, hasVoted } = unwrap(
        wasVoted ? await api.delete<SuccessEnvelope<VoteResult>>(url) : await api.post<SuccessEnvelope<VoteResult>>(url),
      );
      applyToForum((q) => (q.id === id ? { ...q, voteCount, hasVoted } : q));
    } catch (err) {
      console.error(err);
      applyToForum(toggleVote); // ย้อนกลับถ้าโหวตไม่สำเร็จ
    }
  };

  // โหลดข้อมูลตัวอย่าง (เฉพาะผู้ดูแลระบบ — ไม่ลบกระทู้จริงของผู้ใช้)
  const handleSeedData = async () => {
    setSeeding(true);
    setSeedError("");
    try {
      await api.post("/api/v1/sample-data");
      reload();
    } catch (err) {
      console.error(err);
      setSeedError(errorMessage(err, "เกิดข้อผิดพลาดในการโหลดข้อมูลตัวอย่าง"));
    } finally {
      setSeeding(false);
    }
  };

  const openTab = (next: ForumTab) => {
    setTab(next);
    setSelectedTag("");
  };

  const toggleTag = (tag: string) => {
    setSelectedTag((current) => (current === tag ? "" : tag));
    setTab("all");
  };

  const clearFilters = () => {
    setTab("all");
    setSelectedTag("");
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const hasFilters = tab !== "all" || selectedTag !== "" || debouncedSearch !== "";

  const title = selectedTag
    ? `หมวดหมู่สำหรับ #${selectedTag}`
    : tab === "mine"
      ? "กระทู้ของฉัน"
      : tab === "unanswered"
        ? "กระทู้รอความช่วยเหลือ"
        : tab === "resolved"
          ? "กระทู้ที่แก้ไขแล้ว · มีคำตอบที่ยืนยันแล้ว"
          : tab === "popular"
            ? "กระทู้ยอดนิยม · โหวตและคำตอบมากที่สุด"
            : tab === "saved"
              ? "กระทู้ที่บันทึกไว้อ่านทีหลัง"
              : "กระทู้ล่าสุดทั้งหมด";

  const sampleDataButton = (label: string, className: string) => (
    <button
      type="button"
      onClick={handleSeedData}
      disabled={seeding}
      aria-busy={seeding}
      className={className}
    >
      {seeding ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <RefreshIcon className="h-4 w-4" />}
      {label}
    </button>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="min-w-0 space-y-4 lg:col-span-3">
        <ActivityBanner />

        {/* ค้นหา + ตั้งคำถาม */}
        <div className="flex items-center gap-3 fade-slide-up">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              type="search"
              aria-label="ค้นหากระทู้"
              placeholder="ค้นหากระทู้, คำถาม หรือแท็ก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${input} pl-10`}
            />
          </div>
          {canAsk && (
            <Link href="/questions/new" className={btnPrimary} aria-label="ตั้งคำถาม">
              <EditIcon className="h-4 w-4" />
              <span className="hidden sm:inline">ตั้งคำถาม</span>
            </Link>
          )}
        </div>

        {/* หัวรายการ + แท็บ */}
        <div className={card}>
          <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-4">
            <div>
              <h2 className="font-display text-body-lg font-semibold text-on-surface md:text-headline-md">{title}</h2>
              <p className="mt-1 text-body-md tabular-nums text-on-surface-variant" aria-live="polite">
                {loading ? "กำลังโหลดข้อมูล..." : `${formatNumber(questions.length)} กระทู้`}
              </p>
            </div>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary-container/10 py-1 pr-1.5 pl-2.5 text-label-sm text-primary-container transition-colors duration-150 hover:bg-primary-container/20"
                aria-label={`ล้างตัวกรองแท็ก ${selectedTag}`}
              >
                #{selectedTag} <CloseIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="px-2">
            <Tabs tabs={FORUM_TABS} active={tab} onChange={openTab} />
          </div>
        </div>

        {/* รายการกระทู้ */}
        {showError ? (
          <div className={`${card} px-6 py-12 text-center`} role="alert">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container">
              <AlertCircleIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-body-lg font-semibold text-on-surface">โหลดกระทู้ไม่สำเร็จ</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">
              {errorMessage(result.error, "เกิดข้อผิดพลาดในการโหลดกระทู้ กรุณาลองอีกครั้ง")}
            </p>
            <div className="flex justify-center pt-6">
              <button type="button" onClick={reload} className={btnPrimary}>
                <RefreshIcon className="h-4 w-4" /> ลองอีกครั้ง
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-4" aria-busy="true">
            {slow && (
              <div
                role="status"
                className="flex items-center gap-3 rounded-lg bg-primary-container/10 px-4 py-3 text-body-md text-primary fade-slide-up"
              >
                <SpinnerIcon className="h-4 w-4 shrink-0 animate-spin" />
                <span>เซิร์ฟเวอร์ตอบช้ากว่าปกติ กำลังโหลดกระทู้อยู่</span>
              </div>
            )}
            <QuestionListSkeleton />
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} canVote={canVote} onVote={handleVote} />
            ))}
            {total > questions.length && (
              <p className="py-2 text-center text-caption tabular-nums text-secondary">
                แสดง {formatNumber(questions.length)} จาก {formatNumber(total)} กระทู้ล่าสุด —
                ใช้ช่องค้นหาหรือแท็กเพื่อหากระทู้ที่เก่ากว่านี้
              </p>
            )}
          </div>
        ) : hasFilters ? (
          <div className={`${card} px-6 py-12 text-center`}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <SearchIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-body-lg font-semibold text-on-surface">ไม่พบกระทู้ที่กำลังมองหา</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">
              ขณะนี้ไม่มีกระทู้ใดตรงตามตัวกรองหรือคำค้นหาที่กำหนด
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-6">
              <button type="button" onClick={clearFilters} className={btnSecondary}>
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        ) : (
          <div className={`${card} px-6 py-12 text-center`}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <EditIcon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-body-lg font-semibold text-on-surface">ยังไม่มีกระทู้</h3>
            <p className="mt-2 text-body-md text-on-surface-variant">
              เริ่มต้นด้วยการตั้งคำถามแรกของกระดาน เพื่อนและอาจารย์จะช่วยกันตอบ
            </p>
            {(canAsk || canLoadSampleData) && (
              <div className="flex flex-wrap justify-center gap-3 pt-6">
                {canLoadSampleData && sampleDataButton("โหลดข้อมูลตัวอย่าง", btnSecondary)}
                {canAsk && (
                  <Link href="/questions/new" className={btnPrimary}>
                    <EditIcon className="h-4 w-4" /> ตั้งคำถาม
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* แท็กยอดฮิต + เครื่องมือผู้ดูแลระบบ */}
      <aside className="space-y-4">
        <div className={`${card} p-4 fade-slide-up stagger-1`}>
          <h2 className="mb-3 text-label-sm text-on-surface-variant">แท็กยอดฮิต</h2>
          <div className="flex flex-wrap gap-2">
            {hotTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-label-sm transition-colors duration-150 ${
                    active
                      ? "bg-primary-container text-on-primary"
                      : "bg-surface-variant text-on-surface-variant hover:bg-primary-container/10 hover:text-primary-container"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>

        {canLoadSampleData && (
          <div className="space-y-2">
            {sampleDataButton("โหลดข้อมูลตัวอย่างใหม่", `${btnSecondary} w-full`)}
            {seedError && (
              <p role="alert" className="text-label-sm text-error">
                {seedError}
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
