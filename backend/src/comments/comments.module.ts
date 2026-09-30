import { Module } from '@nestjs/common';
import { OwnershipPolicy } from '../common/ownership';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, OwnershipPolicy],
})
export class CommentsModule {}
