import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { PrismaService } from '../prisma/prisma.service';
import { AUTHOR_SELECT, AuthorView, toAuthorView } from './profile.view';
import { ProfilesService } from './profiles.service';

const ACTIVITY_LIMIT = 20;
const EXCERPT_LENGTH = 140;

export interface ActivityItem {
  /** id ของคำตอบ/ข้อความตอบกลับ */
  id: string;
  kind: 'answer' | 'reply';
  questionId: string;
  questionTitle: string;
  author: AuthorView;
  excerpt: string;
  isVerified: boolean;
  isNew: boolean;
  createdAt: Date;
}

export interface ActivityView {
  unreadCount: number;
  seenAt: Date | null;
  items: ActivityItem[];
}

/**
 * "กิจกรรมของฉัน": คำตอบและข้อความตอบกลับที่คนอื่น (รวมผู้ช่วย AI) เขียนในกระทู้ของเรา
 * ใหม่กว่า activity_seen_at = ยังไม่ได้อ่าน · เปิดดูแล้วกด markSeen ให้นับใหม่ตั้งแต่ตอนนั้น
 */
@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  async activity(user: CoreHubIdentity): Promise<ActivityView> {
    const me = await this.profiles.ensure(user);
    const onMyQuestions: Prisma.CommentWhereInput = {
      question: { authorId: me.id },
      authorId: { not: me.id },
    };

    const [rows, unreadCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: onMyQuestions,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: ACTIVITY_LIMIT,
        select: {
          id: true,
          parentId: true,
          body: true,
          isVerified: true,
          createdAt: true,
          author: { select: AUTHOR_SELECT },
          question: { select: { id: true, title: true } },
        },
      }),
      this.prisma.comment.count({
        where: me.activitySeenAt ? { ...onMyQuestions, createdAt: { gt: me.activitySeenAt } } : onMyQuestions,
      }),
    ]);

    return {
      unreadCount,
      seenAt: me.activitySeenAt,
      items: rows.map((row) => ({
        id: row.id,
        kind: row.parentId === null ? 'answer' : 'reply',
        questionId: row.question.id,
        questionTitle: row.question.title,
        author: toAuthorView(row.author),
        excerpt: row.body.length > EXCERPT_LENGTH ? `${row.body.slice(0, EXCERPT_LENGTH)}…` : row.body,
        isVerified: row.isVerified,
        isNew: me.activitySeenAt === null || row.createdAt > me.activitySeenAt,
        createdAt: row.createdAt,
      })),
    };
  }

  /** อ่านกิจกรรมทั้งหมดแล้ว */
  async markSeen(user: CoreHubIdentity): Promise<{ seenAt: Date }> {
    const me = await this.profiles.ensure(user);
    const seenAt = new Date();
    await this.prisma.profile.update({ where: { id: me.id }, data: { activitySeenAt: seenAt } });
    return { seenAt };
  }
}
