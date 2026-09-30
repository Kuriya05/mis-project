import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryTagsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Length(1, 30)
  q?: string;
}
