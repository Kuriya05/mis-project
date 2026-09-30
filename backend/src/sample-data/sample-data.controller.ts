import { Controller, Post } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { loadSampleData } from './sample-data';

/** ADMIN only: (re)load the sample questions shown on a fresh board. */
@Controller('v1/sample-data')
export class SampleDataController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @RequirePermissions(Permission.SAMPLE_DATA_LOAD)
  load() {
    return loadSampleData(this.prisma);
  }
}
