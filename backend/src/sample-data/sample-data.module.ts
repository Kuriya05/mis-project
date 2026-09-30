import { Module } from '@nestjs/common';
import { SampleDataController } from './sample-data.controller';

@Module({ controllers: [SampleDataController] })
export class SampleDataModule {}
