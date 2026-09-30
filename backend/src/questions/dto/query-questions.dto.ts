import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { QuestionStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { QueryBoolean, Trim } from '../../common/dto/transforms';

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

  /** Waiting questions nobody has commented on yet. */
  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  unanswered?: boolean;
}
