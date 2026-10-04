import { Controller, Get } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { StatsService } from './stats.service';

@Controller('v1/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** Board overview for everyone who can read the board. */
  @Get()
  @RequirePermissions(Permission.QUESTION_READ)
  stats() {
    return this.statsService.stats();
  }
}
