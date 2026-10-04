import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiRequest {
  /** คำสั่งระบบ (system instruction) */
  system: string;
  /** ข้อความของผู้ใช้ — ข้อมูลที่ผู้ใช้พิมพ์อยู่ในนี้เท่านั้น ไม่ปนกับคำสั่งระบบ */
  prompt: string;
  /** JSON schema ของคำตอบ (OpenAPI subset ของ Gemini) */
  responseSchema: Record<string, unknown>;
  /** รุ่นที่ "คิด" ก่อนตอบนับโทเคนที่ใช้คิดรวมใน maxOutputTokens — ตั้งให้พอทั้งคิดและตอบ */
  maxOutputTokens?: number;
  /** minimal = เร็วสุด ไม่คิด · low = คิดสั้น ๆ ก่อนตัดสินใจ */
  thinkingLevel?: 'minimal' | 'low';
}

/** Gemini ตอบไม่ได้ หรือตอบไม่ตรงรูปแบบ */
export class GeminiUnavailableError extends Error {}

interface GenerateContentResponse {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
}

/**
 * ตัวเรียก Gemini (generateContent) ด้วย fetch — ไม่เพิ่ม dependency (allowed-deps.json)
 *
 * - key อ่านจาก GEMINI_API_KEY ฝั่ง server เท่านั้น · ส่งใน header ไม่ใส่ใน URL · ห้าม log
 * - ลองรุ่นตามลำดับใน GEMINI_MODELS: รุ่นแรกคนใช้เยอะ (429/503) หรือหมดอายุ (404) ก็ไปรุ่นถัดไป
 * - ส่งเฉพาะเนื้อหากระทู้และความถนัดของอาจารย์ ไม่ส่ง core_user_id · person_code · token
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  constructor(private readonly config: ConfigService) {}

  get enabled(): boolean {
    return this.apiKey !== '';
  }

  private get apiKey(): string {
    return this.config.get<string>('gemini.apiKey', '');
  }

  async generateJson<T>(request: GeminiRequest): Promise<T> {
    if (!this.enabled) {
      throw new GeminiUnavailableError('GEMINI_API_KEY is not set');
    }

    const models = this.config.get<string[]>('gemini.models', []);
    const baseUrl = this.config.get<string>('gemini.apiUrl', '').replace(/\/+$/, '');
    const timeoutMs = this.config.get<number>('gemini.timeoutMs', 30_000);

    for (const model of models) {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': this.apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: request.system }] },
            contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: request.maxOutputTokens ?? 8192,
              thinkingConfig: { thinkingLevel: request.thinkingLevel ?? 'low' },
              responseMimeType: 'application/json',
              responseSchema: request.responseSchema,
            },
          }),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        this.logger.warn(`Gemini ${model} unreachable: ${(error as Error).name}`);
        continue;
      }

      if (response.status === 429 || response.status === 404 || response.status >= 500) {
        this.logger.warn(`Gemini ${model} answered ${response.status}, trying the next model`);
        continue;
      }
      if (!response.ok) {
        // 400/401/403: ใช้รุ่นอื่นก็ไม่หาย (key หรือคำขอผิด)
        throw new GeminiUnavailableError(`Gemini answered ${response.status}`);
      }

      const body = (await response.json().catch(() => null)) as GenerateContentResponse | null;
      if (body?.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
        // JSON ที่ถูกตัดกลางคันใช้ไม่ได้ — ลองรุ่นถัดไป
        this.logger.warn(`Gemini ${model} ran out of output tokens, trying the next model`);
        continue;
      }
      const text = body?.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text)
        .join('')
        .trim();
      if (!text) {
        throw new GeminiUnavailableError('Gemini answered without text');
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new GeminiUnavailableError('Gemini answered with text that is not JSON');
      }
    }

    throw new GeminiUnavailableError('No Gemini model could answer');
  }
}
