import { IsString, Matches, MaxLength } from 'class-validator';
import { NOT_BLANK } from '../../common/dto/transforms';
import { COMMENT_BODY_MAX } from '../../questions/dto/question-limits';

export class UpdateCommentDto {
  @IsString()
  @Matches(NOT_BLANK, { message: 'body must not be empty' })
  @MaxLength(COMMENT_BODY_MAX)
  body!: string;
}
