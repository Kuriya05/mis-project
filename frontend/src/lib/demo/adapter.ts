import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { Answer, Author, Comment, ErrorCode, QuestionDetail, QuestionSummary, Tag } from "../types";
import { DEMO_USER_ID, demoProfile } from "./profile";
import { PROFILES, QUESTIONS, type ProfileKey } from "./sample-data";

// แทน backend ด้วยข้อมูลในหน่วยความจำของเบราว์เซอร์ (รีเฟรชหน้าแล้วกลับเป็นข้อมูลตัวอย่างเดิม)
// รูปแบบคำตอบและกติกาเลียนแบบ backend/src/questions และ backend/src/comments

interface StoredComment {
  id: string;
  questionId: string;
  parentId: string | null;
  authorId: string;
  body: string;
  isVerified: boolean;
  recommendedFacultyIds: string[];
  relatedQuestionIds: string[];
  voters: Set<string>;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredQuestion {
  id: string;
  authorId: string;
  title: string;
  body: string;
  tags: string[];
  voters: Set<string>;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * UUID v4 — crypto.randomUUID มีเฉพาะ secure context (https หรือ localhost) จึงใช้ไม่ได้ตอนเปิด
 * dev server ผ่าน IP (เช่น http://26.155.53.96:3235) · getRandomValues ใช้ได้ทุก context
 */
export function uuidV4(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const DEMO_ASSISTANT_ID = "demo-assistant";

const authors = new Map<string, Author>([
  ...Object.values(PROFILES).map(
    (p): [string, Author] => [p.id, { id: p.id, coreRole: p.coreRole, personCode: p.personCode, isAssistant: false }],
  ),
  [DEMO_ASSISTANT_ID, { id: DEMO_ASSISTANT_ID, coreRole: "staff", personCode: null, isAssistant: true }],
]);
const questions = new Map<string, StoredQuestion>();
/** กระทู้ที่ผู้ใช้สมมติบันทึกไว้ · เวลาที่เปิดดูกิจกรรมล่าสุด */
const bookmarks = new Set<string>();
let activitySeenAt: string | null = null;
const comments = new Map<string, StoredComment>();

const ago = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const idOf = (keys: readonly ProfileKey[] = []) => new Set(keys.map((k) => PROFILES[k].id));

for (const q of QUESTIONS) {
  const createdAt = ago(q.minutesAgo);
  questions.set(q.id, {
    id: q.id,
    authorId: PROFILES[q.author].id,
    title: q.title,
    body: q.body,
    tags: [...q.tags],
    voters: idOf(q.voters),
    editedAt: null,
    createdAt,
    updatedAt: createdAt,
  });
  for (const c of q.comments) {
    const at = ago(c.minutesAgo);
    comments.set(c.id, {
      id: c.id,
      questionId: q.id,
      parentId: null,
      authorId: PROFILES[c.author].id,
      body: c.body,
      isVerified: c.isVerified ?? false,
      recommendedFacultyIds: [],
      relatedQuestionIds: [],
      voters: idOf(c.voters),
      editedAt: null,
      createdAt: at,
      updatedAt: at,
    });
  }
}

// ---- views ------------------------------------------------------------------

const commentsOf = (questionId: string) =>
  [...comments.values()].filter((c) => c.questionId === questionId);

function isResolved(questionId: string): boolean {
  return commentsOf(questionId).some((c) => c.isVerified);
}

function commentView(c: StoredComment): Comment {
  return {
    id: c.id,
    questionId: c.questionId,
    parentId: c.parentId,
    body: c.body,
    isVerified: c.isVerified,
    recommendedFacultyIds: c.recommendedFacultyIds,
    relatedQuestions: c.relatedQuestionIds.flatMap((id) => {
      const related = questions.get(id);
      return related ? [{ id, title: related.title }] : [];
    }),
    author: authors.get(c.authorId)!,
    voteCount: c.voters.size,
    hasVoted: c.voters.has(DEMO_USER_ID),
    editedAt: c.editedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function summaryView(q: StoredQuestion): QuestionSummary {
  return {
    id: q.id,
    title: q.title,
    status: isResolved(q.id) ? "RESOLVED" : "WAITING",
    tags: q.tags,
    author: authors.get(q.authorId)!,
    voteCount: q.voters.size,
    hasVoted: q.voters.has(DEMO_USER_ID),
    isBookmarked: bookmarks.has(q.id),
    commentCount: commentsOf(q.id).length,
    editedAt: q.editedAt,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

const byCreatedAt = <T extends { createdAt: string }>(a: T, b: T) => a.createdAt.localeCompare(b.createdAt);

function detailView(q: StoredQuestion): QuestionDetail {
  const all = commentsOf(q.id).sort(byCreatedAt);
  const answers: Answer[] = all
    .filter((c) => c.parentId === null)
    .map((c) => ({ ...commentView(c), replies: all.filter((r) => r.parentId === c.id).map(commentView) }));
  return { ...summaryView(q), body: q.body, comments: answers };
}

// ---- ผู้ช่วย AI ตอบกระทู้ใหม่ทุกกระทู้ (ระบบจริงทำที่ backend/src/assistant/assistant-answer.service.ts) ----

/** ถาม /assistant/answer (Gemini) แล้วเพิ่มคำตอบของผู้ช่วย AI เป็นคำตอบแรกของกระทู้ */
async function answerWithAssistant(q: StoredQuestion): Promise<void> {
  const earlier = [...questions.values()]
    .filter(
      (other) =>
        other.id !== q.id &&
        commentsOf(other.id).some((c) => c.parentId === null && c.authorId !== DEMO_ASSISTANT_ID),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40)
    .map((other) => ({
      id: other.id,
      title: other.title,
      body: other.body,
      tags: other.tags,
      resolved: isResolved(other.id),
      answers: commentsOf(other.id)
        .filter((c) => c.parentId === null && c.authorId !== DEMO_ASSISTANT_ID)
        .sort((a, b) => Number(b.isVerified) - Number(a.isVerified) || b.voters.size - a.voters.size)
        .slice(0, 2)
        .map((c) => ({ verified: c.isVerified, body: c.body })),
    }));

  try {
    const res = await fetch("/assistant/answer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: { title: q.title, body: q.body, tags: q.tags }, earlier }),
    });
    if (!res.ok) return;
    const { data } = (await res.json()) as {
      data: { repeatOfIds: string[]; answer: string; recommendedFacultyIds: string[] };
    };
    if (!data.answer || !questions.has(q.id)) return;
    const at = new Date().toISOString();
    const c: StoredComment = {
      id: uuidV4(),
      questionId: q.id,
      parentId: null,
      authorId: DEMO_ASSISTANT_ID,
      body: data.answer,
      isVerified: false,
      recommendedFacultyIds: data.recommendedFacultyIds,
      relatedQuestionIds: data.repeatOfIds,
      voters: new Set(),
      editedAt: null,
      createdAt: at,
      updatedAt: at,
    };
    comments.set(c.id, c);
  } catch (err) {
    console.warn("[demo] AI answer for a new question failed", err);
  }
}

// ---- กิจกรรมของฉัน และสถิติ (กติกาเดียวกับ backend/src/profiles/activity.service.ts · stats.service.ts) ----

function activityView() {
  const mine = new Set([...questions.values()].filter((q) => q.authorId === DEMO_USER_ID).map((q) => q.id));
  const onMine = [...comments.values()]
    .filter((c) => mine.has(c.questionId) && c.authorId !== DEMO_USER_ID)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isNew = (c: StoredComment) => activitySeenAt === null || c.createdAt > activitySeenAt;
  return {
    unreadCount: onMine.filter(isNew).length,
    seenAt: activitySeenAt,
    items: onMine.slice(0, 20).map((c) => ({
      id: c.id,
      kind: c.parentId === null ? "answer" : "reply",
      questionId: c.questionId,
      questionTitle: questions.get(c.questionId)?.title ?? "",
      author: authors.get(c.authorId)!,
      excerpt: c.body.length > 140 ? `${c.body.slice(0, 140)}…` : c.body,
      isVerified: c.isVerified,
      isNew: isNew(c),
      createdAt: c.createdAt,
    })),
  };
}

function statsView() {
  const DAY = 24 * 60 * 60 * 1000;
  // วันจันทร์ต้นสัปดาห์ตามเวลาไทย (UTC+7) — กติกาเดียวกับ backend weekStartOf
  const weekStart = (iso: string) => {
    const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
    const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return day - ((new Date(day).getUTCDay() + 6) % 7) * DAY;
  };
  const first = weekStart(new Date().toISOString()) - 7 * 7 * DAY;
  const weekly = Array.from({ length: 8 }, (_, i) => ({
    weekStart: new Date(first + i * 7 * DAY).toISOString().slice(0, 10),
    questions: 0,
    answers: 0,
  }));
  const answers = [...comments.values()].filter((c) => c.parentId === null && c.authorId !== DEMO_ASSISTANT_ID);
  for (const q of questions.values()) {
    const i = Math.floor((weekStart(q.createdAt) - first) / (7 * DAY));
    if (i >= 0) weekly[i].questions += 1;
  }
  for (const a of answers) {
    const i = Math.floor((weekStart(a.createdAt) - first) / (7 * DAY));
    if (i >= 0) weekly[i].answers += 1;
  }
  const tagCounts = new Map<string, number>();
  for (const q of questions.values()) for (const t of q.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const helpers = new Map<string, { answers: number; verifiedAnswers: number }>();
  for (const a of answers) {
    const h = helpers.get(a.authorId) ?? { answers: 0, verifiedAnswers: 0 };
    h.answers += 1;
    if (a.isVerified) h.verifiedAnswers += 1;
    helpers.set(a.authorId, h);
  }
  return {
    totals: {
      questions: questions.size,
      resolved: [...questions.keys()].filter(isResolved).length,
      answers: answers.length,
      assistantAnswers: [...comments.values()].filter((c) => c.authorId === DEMO_ASSISTANT_ID).length,
    },
    topTags: [...tagCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8),
    weekly,
    topHelpers: [...helpers.entries()]
      .sort(([, a], [, b]) => b.verifiedAnswers - a.verifiedAnswers || b.answers - a.answers)
      .slice(0, 5)
      .map(([id, h]) => ({ author: authors.get(id)!, ...h })),
  };
}

// ---- tag suggestion (สำเนากติกาจาก backend/src/tags/tag-suggester.ts) -------

const TAG_RULES: ReadonlyArray<{ tag: string; keywords: readonly string[] }> = [
  { tag: "Java", keywords: ["java", "spring", "jvm"] },
  {
    tag: "Database",
    keywords: ["database", "sql", "mongo", "mysql", "postgres", "db", "refused", "typeorm", "prisma"],
  },
  { tag: "Error", keywords: ["error", "exception", "bug", "fail", "refused", "crash"] },
  { tag: "NestJS", keywords: ["nest", "nestjs", "typeorm"] },
  { tag: "React", keywords: ["react", "useeffect", "usestate", "hooks", "nextjs"] },
  { tag: "Curriculum", keywords: ["หลักสูตร", "curriculum", "หน่วยกิต", "cwie", "2570", "รหัส 70", "รหัส70"] },
];

function suggestTags(title: string, body: string): string[] {
  const text = `${title} ${body}`.toLowerCase();
  const tags = TAG_RULES.filter((r) => r.keywords.some((k) => text.includes(k))).map((r) => r.tag);
  return tags.length > 0 ? tags : ["General"];
}

// ---- routing ----------------------------------------------------------------

class DemoError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

type Body = Record<string, unknown>;
type Result = { status?: number; data: unknown; meta?: Record<string, number> };

function mustQuestion(id: string): StoredQuestion {
  const q = questions.get(id);
  if (!q) throw new DemoError(404, "NOT_FOUND", "Question not found");
  return q;
}

function mustComment(id: string): StoredComment {
  const c = comments.get(id);
  if (!c) throw new DemoError(404, "NOT_FOUND", "Comment not found");
  return c;
}

function mustOwn(authorId: string): void {
  if (authorId !== DEMO_USER_ID) throw new DemoError(403, "FORBIDDEN", "Not the owner");
}

function requireText(body: Body, field: string): string {
  const value = typeof body[field] === "string" ? (body[field] as string).trim() : "";
  if (!value) throw new DemoError(400, "VALIDATION_ERROR", `${field} is required`, field);
  return value;
}

function listQuestions(params: Body): Result {
  const q = typeof params.q === "string" ? params.q.toLowerCase() : "";
  const tag = typeof params.tag === "string" ? params.tag : "";
  const truthy = (v: unknown) => v === true || v === "true";
  let items = [...questions.values()].sort((a, b) => byCreatedAt(b, a));
  if (q) {
    items = items.filter(
      (x) =>
        x.title.toLowerCase().includes(q) ||
        x.body.toLowerCase().includes(q) ||
        x.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  if (tag) items = items.filter((x) => x.tags.includes(tag));
  if (params.status) items = items.filter((x) => summaryView(x).status === params.status);
  if (truthy(params.mine)) items = items.filter((x) => x.authorId === DEMO_USER_ID);
  if (truthy(params.bookmarked)) items = items.filter((x) => bookmarks.has(x.id));
  // ผู้ช่วย AI ตอบทุกกระทู้ใหม่ — "รอคนตอบ" จึงนับเฉพาะคำตอบของคน
  if (truthy(params.unanswered)) {
    items = items.filter(
      (x) => !isResolved(x.id) && !commentsOf(x.id).some((c) => c.authorId !== DEMO_ASSISTANT_ID),
    );
  }
  if (params.sort === "popular") {
    items.sort(
      (a, b) =>
        b.voters.size - a.voters.size ||
        commentsOf(b.id).length - commentsOf(a.id).length ||
        byCreatedAt(b, a),
    );
  }

  const limit = Number(params.limit) || 20;
  const page = Number(params.page) || 1;
  const total = items.length;
  return {
    data: items.slice((page - 1) * limit, page * limit).map(summaryView),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

function listTags(params: Body): Result {
  const counts = new Map<string, number>();
  for (const q of questions.values()) for (const t of q.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags: Tag[] = [...counts]
    .map(([name, questionCount]) => ({ name, questionCount }))
    .sort((a, b) => b.questionCount - a.questionCount || a.name.localeCompare(b.name));
  return { data: tags.slice(0, Number(params.limit) || tags.length) };
}

function vote(voters: Set<string>, on: boolean) {
  if (on) voters.add(DEMO_USER_ID);
  else voters.delete(DEMO_USER_ID);
  return { voteCount: voters.size, hasVoted: voters.has(DEMO_USER_ID) };
}

function route(method: string, path: string, params: Body, body: Body): Result {
  const now = new Date().toISOString();
  let m: RegExpMatchArray | null;

  if (path === "/profiles/me" && method === "get") {
    return { data: demoProfile() };
  }
  if (path === "/profiles/me/activity" && method === "get") return { data: activityView() };
  if (path === "/profiles/me/activity/seen" && method === "post") {
    activitySeenAt = now;
    return { data: { seenAt: now } };
  }
  if (path === "/stats" && method === "get") return { data: statsView() };

  if (path === "/tags" && method === "get") return listTags(params);
  if (path === "/tag-suggestions" && method === "post") {
    return { data: { tags: suggestTags(String(body.title ?? ""), String(body.body ?? "")) } };
  }

  if (path === "/questions") {
    if (method === "get") return listQuestions(params);
    if (method === "post") {
      const title = requireText(body, "title");
      const text = requireText(body, "body");
      const tags = Array.isArray(body.tags) && body.tags.length > 0 ? body.tags.map(String) : suggestTags(title, text);
      const q: StoredQuestion = {
        id: uuidV4(),
        authorId: DEMO_USER_ID,
        title,
        body: text,
        tags,
        voters: new Set(),
        editedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      questions.set(q.id, q);
      void answerWithAssistant(q);
      return { status: 201, data: detailView(q) };
    }
  }

  if ((m = path.match(/^\/questions\/([^/]+)$/))) {
    const q = mustQuestion(m[1]);
    if (method === "get") return { data: detailView(q) };
    mustOwn(q.authorId);
    if (method === "patch") {
      if (body.title !== undefined) q.title = requireText(body, "title");
      if (body.body !== undefined) q.body = requireText(body, "body");
      if (Array.isArray(body.tags)) q.tags = body.tags.map(String);
      q.editedAt = now;
      q.updatedAt = now;
      return { data: detailView(q) };
    }
    if (method === "delete") {
      questions.delete(q.id);
      for (const c of commentsOf(q.id)) comments.delete(c.id);
      return { data: { id: q.id, deleted: true } };
    }
  }

  if ((m = path.match(/^\/questions\/([^/]+)\/votes$/))) {
    const q = mustQuestion(m[1]);
    return { data: { id: q.id, ...vote(q.voters, method === "post") } };
  }

  if ((m = path.match(/^\/questions\/([^/]+)\/bookmark$/))) {
    const q = mustQuestion(m[1]);
    if (method === "post") {
      bookmarks.add(q.id);
      return { status: 201, data: { id: q.id, isBookmarked: true } };
    }
    bookmarks.delete(q.id);
    return { data: { id: q.id, isBookmarked: false, deleted: true } };
  }

  if ((m = path.match(/^\/questions\/([^/]+)\/comments$/)) && method === "post") {
    const q = mustQuestion(m[1]);
    const parentId = typeof body.parentId === "string" ? body.parentId : null;
    if (parentId && mustComment(parentId).questionId !== q.id) {
      throw new DemoError(400, "VALIDATION_ERROR", "parentId belongs to another question", "parentId");
    }
    const c: StoredComment = {
      id: uuidV4(),
      questionId: q.id,
      parentId,
      authorId: DEMO_USER_ID,
      body: requireText(body, "body"),
      isVerified: false,
      recommendedFacultyIds: [],
      relatedQuestionIds: [],
      voters: new Set(),
      editedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    comments.set(c.id, c);
    return { status: 201, data: commentView(c) };
  }

  if ((m = path.match(/^\/comments\/([^/]+)$/))) {
    const c = mustComment(m[1]);
    mustOwn(c.authorId);
    if (method === "patch") {
      c.body = requireText(body, "body");
      c.editedAt = now;
      c.updatedAt = now;
      return { data: commentView(c) };
    }
    if (method === "delete") {
      comments.delete(c.id);
      for (const r of commentsOf(c.questionId)) if (r.parentId === c.id) comments.delete(r.id);
      return { data: { id: c.id, deleted: true } };
    }
  }

  if ((m = path.match(/^\/comments\/([^/]+)\/votes$/))) {
    const c = mustComment(m[1]);
    return { data: { id: c.id, ...vote(c.voters, method === "post") } };
  }

  if ((m = path.match(/^\/comments\/([^/]+)\/verification$/))) {
    const c = mustComment(m[1]);
    // นักศึกษายืนยันคำตอบได้เฉพาะในกระทู้ของตัวเอง (comment:verify:own)
    mustOwn(mustQuestion(c.questionId).authorId);
    const on = method === "post";
    for (const other of commentsOf(c.questionId)) other.isVerified = false;
    c.isVerified = on;
    return {
      data: { id: c.id, questionId: c.questionId, isVerified: on, questionStatus: on ? "RESOLVED" : "WAITING" },
    };
  }

  if (path === "/sample-data") throw new DemoError(403, "FORBIDDEN", "Admin only");

  throw new DemoError(404, "NOT_FOUND", `No demo route for ${method.toUpperCase()} ${path}`);
}

export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  const url = new URL(config.url ?? "", window.location.origin);
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const method = (config.method ?? "get").toLowerCase();
  const params: Body = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  const body: Body = typeof config.data === "string" && config.data ? JSON.parse(config.data) : (config.data ?? {});

  // หน่วงเล็กน้อยให้เห็น skeleton/สถานะกำลังโหลดเหมือนเรียก API จริง
  await new Promise((resolve) => setTimeout(resolve, 250));

  const respond = (status: number, data: unknown): AxiosResponse => ({
    status,
    statusText: String(status),
    data,
    headers: new AxiosHeaders({ "content-type": "application/json" }),
    config,
    request: {},
  });

  try {
    const result = route(method, path, params, body);
    return respond(result.status ?? 200, {
      success: true,
      data: result.data,
      ...(result.meta ? { meta: result.meta } : {}),
    });
  } catch (err) {
    if (!(err instanceof DemoError)) throw err;
    const response = respond(err.status, {
      success: false,
      error: { code: err.code, message: err.message, ...(err.field ? { details: { field: err.field } } : {}) },
    });
    throw new AxiosError(err.message, AxiosError.ERR_BAD_REQUEST, config, {}, response);
  }
};
