import { Prisma } from '../../generated/prisma/client';
import { AUTHOR_SELECT, AuthorView, toAuthorView } from '../profiles/profile.view';

export function commentSelect(viewerId: string) {
  return {
    id: true,
    questionId: true,
    parentId: true,
    body: true,
    isVerified: true,
    recommendedFacultyIds: true,
    relatedQuestionIds: true,
    editedAt: true,
    createdAt: true,
    updatedAt: true,
    author: { select: AUTHOR_SELECT },
    _count: { select: { votes: true } },
    votes: { where: { profileId: viewerId }, select: { id: true }, take: 1 },
  } satisfies Prisma.CommentSelect;
}

type CommentRow = Prisma.CommentGetPayload<{ select: ReturnType<typeof commentSelect> }>;

export interface CommentView {
  id: string;
  questionId: string;
  parentId: string | null;
  body: string;
  isVerified: boolean;
  /** คำตอบของผู้ช่วย AI: id อาจารย์ในทำเนียบของสาขาที่ถนัดเรื่องนี้ เรียงจากตรงที่สุด */
  recommendedFacultyIds: string[];
  /** คำตอบของผู้ช่วย AI: กระทู้เดิมที่ถามเรื่องเดียวกัน */
  relatedQuestions: { id: string; title: string }[];
  author: AuthorView;
  voteCount: number;
  hasVoted: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** `questionTitles`: ชื่อของกระทู้ที่ relatedQuestionIds อ้างถึง (ไม่มีในนี้ = ไม่แสดง) */
export function toCommentView(
  row: CommentRow,
  questionTitles: ReadonlyMap<string, string> = new Map(),
): CommentView {
  return {
    id: row.id,
    questionId: row.questionId,
    parentId: row.parentId,
    body: row.body,
    isVerified: row.isVerified,
    recommendedFacultyIds: row.recommendedFacultyIds,
    relatedQuestions: row.relatedQuestionIds.flatMap((id) => {
      const title = questionTitles.get(id);
      return title === undefined ? [] : [{ id, title }];
    }),
    author: toAuthorView(row.author),
    voteCount: row._count.votes,
    hasVoted: row.votes.length > 0,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Answers: the verified one first, then the most voted, then the newest. */
export const ANSWER_ORDER = [
  { isVerified: 'desc' },
  { votes: { _count: 'desc' } },
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.CommentOrderByWithRelationInput[];

/** Replies read as a conversation: oldest first. */
export const REPLY_ORDER = [
  { createdAt: 'asc' },
  { id: 'asc' },
] satisfies Prisma.CommentOrderByWithRelationInput[];
