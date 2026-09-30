// ตัวกรองของหน้ารวมกระทู้ ที่เก็บไว้ใน URL: /questions?tab=mine&tag=Java&q=text

export const FORUM_TABS = ["all", "mine", "unanswered"] as const;
export type ForumTab = (typeof FORUM_TABS)[number];

export interface ForumFilters {
  tab: ForumTab;
  tag: string;
  q: string;
}

type RawParam = string | string[] | undefined;

const first = (value: RawParam): string => (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim();

/** แปลง searchParams ดิบจาก URL เป็นตัวกรองที่ถูกต้องเสมอ */
export function parseForumFilters(params: Record<string, RawParam>): ForumFilters {
  const tab = first(params.tab);
  return {
    tab: (FORUM_TABS as readonly string[]).includes(tab) ? (tab as ForumTab) : "all",
    tag: first(params.tag),
    q: first(params.q),
  };
}

export function sameFilters(a: ForumFilters, b: ForumFilters): boolean {
  return a.tab === b.tab && a.tag === b.tag && a.q === b.q;
}

/** `/questions?...` ที่ไม่มีพารามิเตอร์ค่าเริ่มต้น */
export function forumHref(filters: ForumFilters): string {
  const search = new URLSearchParams();
  if (filters.tab !== "all") search.set("tab", filters.tab);
  if (filters.tag) search.set("tag", filters.tag);
  if (filters.q) search.set("q", filters.q);
  const qs = search.toString();
  return qs ? `/questions?${qs}` : "/questions";
}
