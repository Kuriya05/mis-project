import { Module } from '@nestjs/common';
import { OwnershipPolicy } from '../common/ownership';
import { TagsModule } from '../tags/tags.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [TagsModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, OwnershipPolicy],
})
export class QuestionsModule {}
