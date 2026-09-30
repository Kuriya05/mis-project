import { Injectable } from '@nestjs/common';
import { Prisma, QuestionStatus } from '../../generated/prisma/client';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { AppException } from '../common/errors';
import { OwnershipPolicy } from '../common/ownership';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { normalizeTagNames } from '../tags/tag-names';
import { suggestTags } from '../tags/tag-suggester';
import { TagsService } from '../tags/tags.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import {
  QuestionDetailView,
  QuestionSummaryView,
  questionDetailSelect,
  questionSummarySelect,
  toQuestionDetailView,
  toQuestionSummaryView,
} from './question.view';

export interface VoteState {
  id: string;
  voteCount: number;
  hasVoted: boolean;
}

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly tags: TagsService,
    private readonly ownership: OwnershipPolicy,
  ) {}

  async findAll(
    user: CoreHubIdentity,
    query: QueryQuestionsDto,
  ): Promise<{ items: QuestionSummaryView[]; total: number }> {
    const viewer = await this.profiles.ensure(user);
    const filters: Prisma.QuestionWhereInput[] = [];

    if (query.q) {
      filters.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { body: { contains: query.q, mode: 'insensitive' } },
          { tags: { some: { tag: { name: { contains: query.q, mode: 'insensitive' } } } } },
        ],
      });
    }
    if (query.tag) {
      filters.push({
        tags: { some: { tag: { name: { equals: query.tag, mode: 'insensitive' } } } },
      });
    }
    if (query.status) {
      filters.push({ status: query.status });
    }
    if (query.mine) {
      filters.push({ authorId: viewer.id });
    }
    if (query.unanswered) {
      filters.push({ status: QuestionStatus.WAITING, comments: { none: {} } });
    }

    const where: Prisma.QuestionWhereInput = { AND: filters };
    const [rows, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        select: questionSummarySelect(viewer.id),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.question.count({ where }),
    ]);

    return { items: rows.map(toQuestionSummaryView), total };
  }

  async findOne(user: CoreHubIdentity, id: string): Promise<QuestionDetailView> {
    const viewer = await this.profiles.ensure(user);
    return this.detail(id, viewer.id);
  }

  async create(user: CoreHubIdentity, dto: CreateQuestionDto): Promise<QuestionDetailView> {
    const author = await this.profiles.ensure(user);
    const requested = normalizeTagNames(dto.tags ?? []);
    const tagNames = requested.length > 0 ? requested : suggestTags(dto.title, dto.body);

    const id = await this.prisma.$transaction(async (tx) => {
      const tagIds = await this.tags.resolveIds(tx, tagNames);
      const question = await tx.question.create({
        data: {
          authorId: author.id,
          title: dto.title,
          body: dto.body,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
        select: { id: true },
      });
      return question.id;
    });

    return this.detail(id, author.id);
  }

  async update(
    user: CoreHubIdentity,
    id: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionDetailView> {
    const viewer = await this.profiles.ensure(user);
    const question = await this.ownerOf(id);
    this.ownership.assert(
      user,
      question.author.coreUserId,
      { own: Permission.QUESTION_UPDATE_OWN, any: Permission.QUESTION_UPDATE_ANY },
      'question:update',
    );

    await this.prisma.$transaction(async (tx) => {
      if (dto.tags !== undefined) {
        const tagIds = await this.tags.resolveIds(tx, normalizeTagNames(dto.tags));
        await tx.questionTag.deleteMany({ where: { questionId: id } });
        await tx.questionTag.createMany({ data: tagIds.map((tagId) => ({ questionId: id, tagId })) });
      }
      await tx.question.update({
        where: { id },
        data: { title: dto.title, body: dto.body, editedAt: new Date() },
      });
    });

    return this.detail(id, viewer.id);
  }

  /** Answers, replies, votes and tag links go with it (ON DELETE CASCADE). */
  async remove(user: CoreHubIdentity, id: string): Promise<{ id: string; deleted: true }> {
    await this.profiles.ensure(user);
    const question = await this.ownerOf(id);
    this.ownership.assert(
      user,
      question.author.coreUserId,
      { own: Permission.QUESTION_DELETE_OWN, any: Permission.QUESTION_DELETE_ANY },
      'question:delete',
    );

    await this.prisma.question.delete({ where: { id } });
    return { id, deleted: true };
  }

  /** Idempotent: voting twice leaves one vote. */
  async vote(user: CoreHubIdentity, id: string): Promise<VoteState> {
    const voter = await this.profiles.ensure(user);
    await this.ownerOf(id);
    await this.prisma.questionVote.createMany({
      data: [{ questionId: id, profileId: voter.id }],
      skipDuplicates: true,
    });
    return this.voteState(id, voter.id);
  }

  async unvote(user: CoreHubIdentity, id: string): Promise<VoteState & { deleted: true }> {
    const voter = await this.profiles.ensure(user);
    await this.ownerOf(id);
    await this.prisma.questionVote.deleteMany({ where: { questionId: id, profileId: voter.id } });
    return { ...(await this.voteState(id, voter.id)), deleted: true };
  }

  private async detail(id: string, viewerId: string): Promise<QuestionDetailView> {
    const row = await this.prisma.question.findUnique({
      where: { id },
      select: questionDetailSelect(viewerId),
    });
    if (!row) {
      throw AppException.notFound('Question not found');
    }
    return toQuestionDetailView(row);
  }

  private async ownerOf(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: { id: true, author: { select: { coreUserId: true } } },
    });
    if (!question) {
      throw AppException.notFound('Question not found');
    }
    return question;
  }

  private async voteState(id: string, viewerId: string): Promise<VoteState> {
    const [voteCount, mine] = await Promise.all([
      this.prisma.questionVote.count({ where: { questionId: id } }),
      this.prisma.questionVote.count({ where: { questionId: id, profileId: viewerId } }),
    ]);
    return { id, voteCount, hasVoted: mine > 0 };
  }
}
