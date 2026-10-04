import { Module } from '@nestjs/common';
import { GeminiClient } from './gemini.client';
import { AssistantAnswerService } from './assistant-answer.service';

/** ผู้ช่วย AI (Gemini) ของกระดานถาม-ตอบ — ต้องมี ConfigModule แบบ global อยู่แล้ว */
@Module({
  providers: [GeminiClient, AssistantAnswerService],
  exports: [AssistantAnswerService],
})
export class AssistantModule {}
