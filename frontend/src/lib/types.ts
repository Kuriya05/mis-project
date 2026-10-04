// รูปแบบข้อมูลที่ API ของ backend ส่งกลับมา (JSON เป็น camelCase ตาม api-conventions.md)

export type CoreRole = "student" | "alumni" | "lecturer" | "staff" | "guest" | "admin";

export type Permission =
  | "question:read"
  | "question:create"
  | "question:update:own"
  | "question:update:any"
  | "question:delete:own"
  | "question:delete:any"
  | "question:vote"
  | "question:bookmark"
  | "comment:create"
  | "comment:update:own"
  | "comment:update:any"
  | "comment:delete:own"
  | "comment:delete:any"
  | "comment:vote"
  | "comment:verify:own"
  | "comment:verify:any"
  | "tag:read"
  | "profile:read:own"
  | "sample-data:load";

/** GET /api/v1/profiles/me */
export interface MyProfile {
  id: string;
  coreUserId: string;
  email: string;
  /** รหัสบุคคลจาก Core Hub · null = บัญชีไม่ผูกกับบุคคล */
  personCode: string | null;
  coreRole: CoreRole;
  subsystemRole: string;
  permissions: Permission[];
  session: { expiresAt: string };
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  personCode: string | null;
  coreRole: CoreRole;
  /** ผู้ช่วย AI ของระบบ ไม่ใช่คน */
  isAssistant: boolean;
}

export type QuestionStatus = "WAITING" | "RESOLVED";

export interface QuestionSummary {
  id: string;
  title: string;
  status: QuestionStatus;
  tags: string[];
  author: Author;
  voteCount: number;
  hasVoted: boolean;
  /** ผู้ดูบันทึกกระทู้นี้ไว้อ่านทีหลัง */
  isBookmarked: boolean;
  commentCount: number;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  questionId: string;
  parentId: string | null;
  body: string;
  isVerified: boolean;
  /** คำตอบของผู้ช่วย AI: id อาจารย์ในทำเนียบ (data/faculty.ts) ทุกคนที่ถนัดเรื่องนี้ เรียงจากตรงที่สุด */
  recommendedFacultyIds: string[];
  /** คำตอบของผู้ช่วย AI: กระทู้เดิมที่ถามเรื่องเดียวกัน */
  relatedQuestions: { id: string; title: string }[];
  author: Author;
  voteCount: number;
  hasVoted: boolean;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Answer extends Comment {
  replies: Comment[];
}

export interface QuestionDetail extends QuestionSummary {
  body: string;
  comments: Answer[];
}

export interface Tag {
  name: string;
  questionCount: number;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

/** standards/contracts/error-codes.json — closed enum */
export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ErrorEnvelope {
  success: false;
  error: { code: ErrorCode | string; message: string; details?: { field?: string } & Record<string, unknown> };
}

/** GET /api/v1/profiles/me/activity — คำตอบที่คนอื่น (รวมผู้ช่วย AI) เขียนในกระทู้ของเรา */
export interface ActivityItem {
  id: string;
  kind: "answer" | "reply";
  questionId: string;
  questionTitle: string;
  author: Author;
  excerpt: string;
  isVerified: boolean;
  isNew: boolean;
  createdAt: string;
}

export interface Activity {
  unreadCount: number;
  seenAt: string | null;
  items: ActivityItem[];
}

/** GET /api/v1/stats */
export interface BoardStats {
  totals: { questions: number; resolved: number; answers: number; assistantAnswers: number };
  topTags: { name: string; count: number }[];
  weekly: { weekStart: string; questions: number; answers: number }[];
  topHelpers: { author: Author; answers: number; verifiedAnswers: number }[];
}
