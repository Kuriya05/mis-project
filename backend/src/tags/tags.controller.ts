import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CreateTagSuggestionDto } from './dto/create-tag-suggestion.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import { suggestTags } from './tag-suggester';
import { TagsService } from './tags.service';

@Controller('v1')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get('tags')
  @RequirePermissions(Permission.TAG_READ)
  async findAll(@Query() query: QueryTagsDto) {
    const { items, total } = await this.tags.findAll(query);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  /** Computes a suggestion; nothing is stored, so it answers 200 rather than 201. */
  @Post('tag-suggestions')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.QUESTION_CREATE)
  suggest(@Body() dto: CreateTagSuggestionDto) {
    return { tags: suggestTags(dto.title ?? '', dto.body ?? '') };
  }
}
