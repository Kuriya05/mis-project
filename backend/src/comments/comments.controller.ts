import { Body, Controller, Delete, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('v1')
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post('questions/:questionId/comments')
  @RequirePermissions(Permission.COMMENT_CREATE)
  create(
    @CurrentUser() user: CoreHubIdentity,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user, questionId, dto);
  }

  @Patch('comments/:id')
  @RequirePermissions(Permission.COMMENT_UPDATE_OWN, Permission.COMMENT_UPDATE_ANY)
  update(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.comments.update(user, id, dto);
  }

  @Delete('comments/:id')
  @RequirePermissions(Permission.COMMENT_DELETE_OWN, Permission.COMMENT_DELETE_ANY)
  remove(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.comments.remove(user, id);
  }

  @Post('comments/:id/votes')
  @RequirePermissions(Permission.COMMENT_VOTE)
  vote(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.comments.vote(user, id);
  }

  @Delete('comments/:id/votes')
  @RequirePermissions(Permission.COMMENT_VOTE)
  unvote(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.comments.unvote(user, id);
  }

  @Post('comments/:id/verification')
  @RequirePermissions(Permission.COMMENT_VERIFY_OWN, Permission.COMMENT_VERIFY_ANY)
  verify(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.comments.verify(user, id);
  }

  @Delete('comments/:id/verification')
  @RequirePermissions(Permission.COMMENT_VERIFY_OWN, Permission.COMMENT_VERIFY_ANY)
  unverify(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.comments.unverify(user, id);
  }
}
