import { Injectable } from '@nestjs/common';
import { Prisma, QuestionStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AUTHOR_SELECT, AuthorView, toAuthorView } from '../profiles/profile.view';

const TOP_TAGS = 8;
const TOP_HELPERS = 5;
const WEEKS = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeeklyCount {
  /** วันจันทร์ต้นสัปดาห์ตามเวลาไทย (YYYY-MM-DD) */
  weekStart: string;
  questions: number;
  answers: number;
}

export interface Helper {
  author: AuthorView;
  answers: number;
  verifiedAnswers: number;
}

export interface StatsView {
  totals: {
    questions: number;
    resolved: number;
    /** คำตอบของคน (ไม่นับผู้ช่วย AI และข้อความตอบกลับ) */
    answers: number;
    assistantAnswers: number;
  };
  topTags: { name: string; count: number }[];
  weekly: WeeklyCount[];
  topHelpers: Helper[];
}

const answerByPerson: Prisma.CommentWhereInput = { parentId: null, author: { isAssistant: false } };

/** เวลาไทย (Asia/Bangkok, UTC+7 ไม่มีเวลาออมแสง) — ui-design-system.md ข้อ 11.3 */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * วันจันทร์ต้นสัปดาห์ (ตามเวลาไทย) ของ `date` แทนด้วยเที่ยงคืน UTC ของวันที่นั้น
 * เช่น 2026-10-04T17:30Z = จันทร์ 5 ต.ค. 00:30 น. เวลาไทย → 2026-10-05
 */
export function weekStartOf(date: Date): Date {
  const local = new Date(date.getTime() + BANGKOK_OFFSET_MS);
  const day = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const sinceMonday = (new Date(day).getUTCDay() + 6) % 7;
  return new Date(day - sinceMonday * DAY_MS);
}

/**
 * ภาพรวมของกระดาน: ยอดรวม · แท็กยอดนิยม · กระทู้/คำตอบรายสัปดาห์ · ผู้ช่วยตอบดีเด่น
 * ผู้ช่วยตอบแสดงเป็นรหัสบุคคล (person_code) ตามมาตรฐาน ไม่มีชื่อ · ไม่นับผู้ช่วย AI
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(now = new Date()): Promise<StatsView> {
    const firstWeek = new Date(weekStartOf(now).getTime() - (WEEKS - 1) * 7 * DAY_MS);

    const [questions, resolved, answers, assistantAnswers, tags, recentQuestions, recentAnswers, byAuthor, verifiedByAuthor] =
      await Promise.all([
        this.prisma.question.count(),
        this.prisma.question.count({ where: { status: QuestionStatus.RESOLVED } }),
        this.prisma.comment.count({ where: answerByPerson }),
        this.prisma.comment.count({ where: { parentId: null, author: { isAssistant: true } } }),
        this.prisma.tag.findMany({
          where: { questions: { some: {} } },
          select: { name: true, _count: { select: { questions: true } } },
          orderBy: [{ questions: { _count: 'desc' } }, { name: 'asc' }],
          take: TOP_TAGS,
        }),
        this.prisma.question.findMany({ where: { createdAt: { gte: firstWeek } }, select: { createdAt: true } }),
        this.prisma.comment.findMany({
          where: { ...answerByPerson, createdAt: { gte: firstWeek } },
          select: { createdAt: true },
        }),
        this.prisma.comment.groupBy({ by: ['authorId'], where: answerByPerson, _count: { _all: true } }),
        this.prisma.comment.groupBy({
          by: ['authorId'],
          where: { ...answerByPerson, isVerified: true },
          _count: { _all: true },
        }),
      ]);

    const weekly: WeeklyCount[] = Array.from({ length: WEEKS }, (_, i) => ({
      weekStart: new Date(firstWeek.getTime() + i * 7 * DAY_MS).toISOString().slice(0, 10),
      questions: 0,
      answers: 0,
    }));
    const bucket = (date: Date) => weekly[Math.floor((weekStartOf(date).getTime() - firstWeek.getTime()) / (7 * DAY_MS))];
    for (const q of recentQuestions) bucket(q.createdAt).questions += 1;
    for (const a of recentAnswers) bucket(a.createdAt).answers += 1;

    const verified = new Map(verifiedByAuthor.map((row) => [row.authorId, row._count._all]));
    const ranked = byAuthor
      .map((row) => ({ authorId: row.authorId, answers: row._count._all, verifiedAnswers: verified.get(row.authorId) ?? 0 }))
      .sort((a, b) => b.verifiedAnswers - a.verifiedAnswers || b.answers - a.answers)
      .slice(0, TOP_HELPERS);
    const authors = await this.prisma.profile.findMany({
      where: { id: { in: ranked.map((r) => r.authorId) } },
      select: AUTHOR_SELECT,
    });
    const authorById = new Map(authors.map((a) => [a.id, a]));

    return {
      totals: { questions, resolved, answers, assistantAnswers },
      topTags: tags.map((t) => ({ name: t.name, count: t._count.questions })),
      weekly,
      topHelpers: ranked.flatMap((r) => {
        const author = authorById.get(r.authorId);
        return author ? [{ author: toAuthorView(author), answers: r.answers, verifiedAnswers: r.verifiedAnswers }] : [];
      }),
    };
  }
}
