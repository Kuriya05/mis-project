import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { NOT_BLANK, Trim } from '../../common/dto/transforms';
import { MAX_TAGS_PER_QUESTION } from '../../tags/tag-names';
import { QUESTION_BODY_MAX, QUESTION_TITLE_MAX } from './question-limits';

export class UpdateQuestionDto {
  @IsOptional()
  @Trim()
  @IsString()
  @Length(1, QUESTION_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(NOT_BLANK, { message: 'body must not be empty' })
  @MaxLength(QUESTION_BODY_MAX)
  body?: string;

  /** Replaces the whole tag list; an empty list removes every tag. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_TAGS_PER_QUESTION)
  @IsString({ each: true })
  @Length(1, 60, { each: true })
  tags?: string[];
}
