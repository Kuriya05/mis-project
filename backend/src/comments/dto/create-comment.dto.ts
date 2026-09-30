import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { NOT_BLANK } from '../../common/dto/transforms';
import { COMMENT_BODY_MAX } from '../../questions/dto/question-limits';

export class CreateCommentDto {
  @IsString()
  @Matches(NOT_BLANK, { message: 'body must not be empty' })
  @MaxLength(COMMENT_BODY_MAX)
  body!: string;

  /** Set = a reply to that answer. Only the question's author may reply. */
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
