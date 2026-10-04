import { Prisma, QuestionStatus } from '../../generated/prisma/client';
import {
  ANSWER_ORDER,
  CommentView,
  REPLY_ORDER,
  commentSelect,
  toCommentView,
} from '../comments/comment.view';
import { AUTHOR_SELECT, AuthorView, toAuthorView } from '../profiles/profile.view';

export function questionSummarySelect(viewerId: string) {
  return {
    id: true,
    title: true,
    status: true,
    editedAt: true,
    createdAt: true,
    updatedAt: true,
    author: { select: AUTHOR_SELECT },
    tags: { select: { tag: { select: { name: true } } }, orderBy: { tag: { name: 'asc' } } },
    _count: { select: { votes: true, comments: true } },
    votes: { where: { profileId: viewerId }, select: { id: true }, take: 1 },
    bookmarks: { where: { profileId: viewerId }, select: { id: true }, take: 1 },
  } satisfies Prisma.QuestionSelect;
}

export function questionDetailSelect(viewerId: string) {
  return {
    ...questionSummarySelect(viewerId),
    body: true,
    comments: {
      where: { parentId: null },
      orderBy: ANSWER_ORDER,
      select: {
        ...commentSelect(viewerId),
        replies: { orderBy: REPLY_ORDER, select: commentSelect(viewerId) },
      },
    },
  } satisfies Prisma.QuestionSelect;
}

type SummaryRow = Prisma.QuestionGetPayload<{ select: ReturnType<typeof questionSummarySelect> }>;
type DetailRow = Prisma.QuestionGetPayload<{ select: ReturnType<typeof questionDetailSelect> }>;

export interface QuestionSummaryView {
  id: string;
  title: string;
  status: QuestionStatus;
  tags: string[];
  author: AuthorView;
  voteCount: number;
  hasVoted: boolean;
  /** The viewer saved this question to read later. */
  isBookmarked: boolean;
  commentCount: number;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnswerView extends CommentView {
  replies: CommentView[];
}

export interface QuestionDetailView extends QuestionSummaryView {
  body: string;
  comments: AnswerView[];
}

export function toQuestionSummaryView(row: SummaryRow): QuestionSummaryView {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    tags: row.tags.map((t) => t.tag.name),
    author: toAuthorView(row.author),
    voteCount: row._count.votes,
    hasVoted: row.votes.length > 0,
    isBookmarked: row.bookmarks.length > 0,
    commentCount: row._count.comments,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toQuestionDetailView(
  row: DetailRow,
  questionTitles: ReadonlyMap<string, string> = new Map(),
): QuestionDetailView {
  return {
    ...toQuestionSummaryView(row),
    body: row.body,
    comments: row.comments.map((answer) => ({
      ...toCommentView(answer, questionTitles),
      replies: answer.replies.map((reply) => toCommentView(reply, questionTitles)),
    })),
  };
}
