// รูปแบบข้อมูลที่ API ของ backend ส่งกลับมา (JSON เป็น camelCase ตาม api-conventions.md)

export type CoreRole = "student" | "alumni" | "staff" | "admin";

export type Permission =
  | "question:read"
  | "question:create"
  | "question:update:own"
  | "question:update:any"
  | "question:delete:own"
  | "question:delete:any"
  | "question:vote"
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
  | "profile:update:own"
  | "sample-data:load";

/** GET/PATCH /api/v1/profiles/me */
export interface MyProfile {
  id: string;
  coreUserId: string;
  email: string;
  displayName: string;
  coreRole: CoreRole;
  subsystemRole: string;
  permissions: Permission[];
  session: { expiresAt: string };
  createdAt: string;
  updatedAt: string;
}

export interface Author {
  id: string;
  displayName: string;
  coreRole: CoreRole;
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
