import { IsOptional, IsString, MaxLength } from 'class-validator';
import { QUESTION_BODY_MAX, QUESTION_TITLE_MAX } from '../../questions/dto/question-limits';

export class CreateTagSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(QUESTION_TITLE_MAX)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(QUESTION_BODY_MAX)
  body?: string;
}
