import { Global, Module } from '@nestjs/common';
import { CoreHubModule } from '../core-hub/core-hub.module';
import { ActivityService } from './activity.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Global()
@Module({
  imports: [CoreHubModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ActivityService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
