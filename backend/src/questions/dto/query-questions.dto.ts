import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { QuestionStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { QueryBoolean, Trim } from '../../common/dto/transforms';

export const QUESTION_SORTS = ['newest', 'popular'] as const;
export type QuestionSort = (typeof QUESTION_SORTS)[number];

export class QueryQuestionsDto extends PaginationQueryDto {
  /** Free-text search over title, body and tag names. */
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, 100)
  q?: string;

  @IsOptional()
  @IsString()
  @Length(1, 30)
  tag?: string;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  /** Only the caller's own questions. */
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  mine?: boolean;

  /** Waiting questions no person has answered yet (the AI assistant's answer does not count). */
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  unanswered?: boolean;

  /** Only the questions the caller saved to read later. */
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  bookmarked?: boolean;

  /** `newest` (default) or `popular`: most votes, then most answers. */
  @IsOptional()
  @IsIn(QUESTION_SORTS)
  sort?: QuestionSort;
}
