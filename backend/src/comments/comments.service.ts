import { Injectable } from '@nestjs/common';
import { QuestionStatus } from '../../generated/prisma/client';
import { AuthEventsLogger } from '../auth/auth-events.logger';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { Permission } from '../auth/permissions';
import { AppException } from '../common/errors';
import { OwnershipPolicy } from '../common/ownership';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { VoteState } from '../questions/questions.service';
import { CommentView, commentSelect, toCommentView } from './comment.view';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

export interface VerificationState {
  id: string;
  questionId: string;
  isVerified: boolean;
  questionStatus: QuestionStatus;
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly ownership: OwnershipPolicy,
    private readonly authEvents: AuthEventsLogger,
  ) {}

  async create(
    user: CoreHubIdentity,
    token: string,
    questionId: string,
    dto: CreateCommentDto,
  ): Promise<CommentView> {
    const author = await this.profiles.ensure(user, token);
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, author: { select: { coreUserId: true } } },
    });
    if (!question) {
      throw AppException.notFound('Question not found');
    }

    if (dto.parentId) {
      if (question.author.coreUserId !== user.id) {
        this.authEvents.authorizationDenied({
          sub: user.id,
          subsystemRole: user.subsystemRole,
          reason: 'not_owner:comment:reply',
        });
        throw AppException.forbidden('Only the author of the question can reply to an answer');
      }
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { questionId: true, parentId: true },
      });
      if (!parent || parent.questionId !== questionId || parent.parentId !== null) {
        throw AppException.badRequest('parentId must be an answer on this question');
      }
    }

    const row = await this.prisma.comment.create({
      data: { questionId, parentId: dto.parentId ?? null, authorId: author.id, body: dto.body },
      select: commentSelect(author.id),
    });
    return toCommentView(row);
  }

  async update(user: CoreHubIdentity, id: string, dto: UpdateCommentDto): Promise<CommentView> {
    const viewer = await this.profiles.ensure(user);
    const comment = await this.ownerOf(id);
    this.ownership.assert(
      user,
      comment.author.coreUserId,
      { own: Permission.COMMENT_UPDATE_OWN, any: Permission.COMMENT_UPDATE_ANY },
      'comment:update',
    );

    const row = await this.prisma.comment.update({
      where: { id },
      data: { body: dto.body, editedAt: new Date() },
      select: commentSelect(viewer.id),
    });
    return toCommentView(row);
  }

  /** Deleting an answer deletes its replies; a deleted verified answer re-opens the question. */
  async remove(user: CoreHubIdentity, id: string): Promise<{ id: string; deleted: true }> {
    await this.profiles.ensure(user);
    const comment = await this.ownerOf(id);
    this.ownership.assert(
      user,
      comment.author.coreUserId,
      { own: Permission.COMMENT_DELETE_OWN, any: Permission.COMMENT_DELETE_ANY },
      'comment:delete',
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.delete({ where: { id } });
      if (comment.isVerified) {
        await tx.question.update({
          where: { id: comment.questionId },
          data: { status: QuestionStatus.WAITING },
        });
      }
    });
    return { id, deleted: true };
  }

  async vote(user: CoreHubIdentity, id: string): Promise<VoteState> {
    const voter = await this.profiles.ensure(user);
    await this.ownerOf(id);
    await this.prisma.commentVote.createMany({
      data: [{ commentId: id, profileId: voter.id }],
      skipDuplicates: true,
    });
    return this.voteState(id, voter.id);
  }

  async unvote(user: CoreHubIdentity, id: string): Promise<VoteState & { deleted: true }> {
    const voter = await this.profiles.ensure(user);
    await this.ownerOf(id);
    await this.prisma.commentVote.deleteMany({ where: { commentId: id, profileId: voter.id } });
    return { ...(await this.voteState(id, voter.id)), deleted: true };
  }

  /** Marks the one accepted answer; any previously accepted answer is un-marked. */
  async verify(user: CoreHubIdentity, id: string): Promise<VerificationState> {
    await this.profiles.ensure(user);
    const comment = await this.assertCanVerify(user, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.updateMany({
        where: { questionId: comment.questionId, isVerified: true, NOT: { id } },
        data: { isVerified: false },
      });
      await tx.comment.update({ where: { id }, data: { isVerified: true } });
      await tx.question.update({
        where: { id: comment.questionId },
        data: { status: QuestionStatus.RESOLVED },
      });
    });

    return {
      id,
      questionId: comment.questionId,
      isVerified: true,
      questionStatus: QuestionStatus.RESOLVED,
    };
  }

  async unverify(
    user: CoreHubIdentity,
    id: string,
  ): Promise<VerificationState & { deleted: true }> {
    await this.profiles.ensure(user);
    const comment = await this.assertCanVerify(user, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.comment.update({ where: { id }, data: { isVerified: false } });
      // at most one answer per question is verified (partial unique index)
      await tx.question.update({
        where: { id: comment.questionId },
        data: { status: QuestionStatus.WAITING },
      });
    });

    return {
      id,
      questionId: comment.questionId,
      isVerified: false,
      questionStatus: QuestionStatus.WAITING,
      deleted: true,
    };
  }

  /** Teachers (comment:verify:any) or the author of the question (comment:verify:own). */
  private async assertCanVerify(user: CoreHubIdentity, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: {
        questionId: true,
        parentId: true,
        question: { select: { author: { select: { coreUserId: true } } } },
      },
    });
    if (!comment) {
      throw AppException.notFound('Comment not found');
    }
    this.ownership.assert(
      user,
      comment.question.author.coreUserId,
      { own: Permission.COMMENT_VERIFY_OWN, any: Permission.COMMENT_VERIFY_ANY },
      'comment:verify',
    );
    if (comment.parentId !== null) {
      throw AppException.badRequest('A reply cannot be the verified answer');
    }
    return comment;
  }

  private async ownerOf(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: {
        questionId: true,
        isVerified: true,
        author: { select: { coreUserId: true } },
      },
    });
    if (!comment) {
      throw AppException.notFound('Comment not found');
    }
    return comment;
  }

  private async voteState(id: string, viewerId: string): Promise<VoteState> {
    const [voteCount, mine] = await Promise.all([
      this.prisma.commentVote.count({ where: { commentId: id } }),
      this.prisma.commentVote.count({ where: { commentId: id, profileId: viewerId } }),
    ]);
    return { id, voteCount, hasVoted: mine > 0 };
  }
}
