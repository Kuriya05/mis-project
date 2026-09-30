import { Prisma } from '../../generated/prisma/client';
import { AUTHOR_SELECT, AuthorView, toAuthorView } from '../profiles/profile.view';

export function commentSelect(viewerId: string) {
  return {
    id: true,
    questionId: true,
    parentId: true,
    body: true,
    isVerified: true,
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
  author: AuthorView;
  voteCount: number;
  hasVoted: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toCommentView(row: CommentRow): CommentView {
  return {
    id: row.id,
    questionId: row.questionId,
    parentId: row.parentId,
    body: row.body,
    isVerified: row.isVerified,
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
