import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QueryQuestionsDto } from './dto/query-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionsService } from './questions.service';

@Controller('v1/questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  @RequirePermissions(Permission.QUESTION_READ)
  async findAll(@CurrentUser() user: CoreHubIdentity, @Query() query: QueryQuestionsDto) {
    const { items, total } = await this.questions.findAll(user, query);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':id')
  @RequirePermissions(Permission.QUESTION_READ)
  findOne(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.findOne(user, id);
  }

  @Post()
  @RequirePermissions(Permission.QUESTION_CREATE)
  create(@CurrentUser() user: CoreHubIdentity, @Body() dto: CreateQuestionDto) {
    return this.questions.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.QUESTION_UPDATE_OWN, Permission.QUESTION_UPDATE_ANY)
  update(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questions.update(user, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.QUESTION_DELETE_OWN, Permission.QUESTION_DELETE_ANY)
  remove(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.remove(user, id);
  }

  @Post(':id/votes')
  @RequirePermissions(Permission.QUESTION_VOTE)
  vote(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.vote(user, id);
  }

  @Delete(':id/votes')
  @RequirePermissions(Permission.QUESTION_VOTE)
  unvote(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    return this.questions.unvote(user, id);
  }
}
