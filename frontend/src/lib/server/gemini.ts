// ตัวเรียก Gemini ฝั่ง server ของหน้าเว็บ (route handler เท่านั้น — ห้าม import จาก component ฝั่ง client)
// key อ่านจาก GEMINI_API_KEY ใน frontend/.env.local · ห้ามตั้งเป็น NEXT_PUBLIC_* · ส่งใน header ไม่ใส่ใน URL · ห้าม log
// ใช้ fetch ไม่เพิ่ม dependency (standards/scripts/lib/allowed-deps.json)

const DEFAULT_MODELS = "gemini-3.5-flash,gemini-flash-lite-latest";
const API_URL = "https://generativelanguage.googleapis.com/v1beta";
const TIMEOUT_MS = 30_000;

export interface GeminiTurn {
  role: "user" | "model";
  text: string;
}

export interface GeminiRequest {
  system: string;
  turns: GeminiTurn[];
  /** ใส่เมื่อต้องการคำตอบเป็น JSON ตาม schema */
  responseSchema?: Record<string, unknown>;
  /** รุ่นที่ "คิด" ก่อนตอบนับโทเคนที่ใช้คิดรวมใน maxOutputTokens — ตั้งให้พอทั้งคิดและตอบ */
  maxOutputTokens?: number;
  /** minimal = เร็วสุด ไม่คิด (แชท) · low = คิดสั้น ๆ ก่อนตัดสินใจ */
  thinkingLevel?: "minimal" | "low";
}

export class GeminiUnavailableError extends Error {}

interface GenerateContentResponse {
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
}

export function geminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** ข้อความคำตอบของ Gemini — ลองรุ่นถัดไปเมื่อรุ่นแรกคนใช้เยอะ (429/503) หรือหมดอายุ (404) */
export async function generate(request: GeminiRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiUnavailableError("GEMINI_API_KEY is not set");

  const models = (process.env.GEMINI_MODELS || DEFAULT_MODELS)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  for (const model of models) {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: request.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: request.maxOutputTokens ?? 8192,
            thinkingConfig: { thinkingLevel: request.thinkingLevel ?? "low" },
            ...(request.responseSchema
              ? { responseMimeType: "application/json", responseSchema: request.responseSchema }
              : {}),
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (err) {
      console.warn(`[gemini] ${model} unreachable: ${(err as Error).name}`);
      continue;
    }

    if (res.status === 429 || res.status === 404 || res.status >= 500) {
      console.warn(`[gemini] ${model} answered ${res.status}, trying the next model`);
      continue;
    }
    if (!res.ok) {
      // ไม่ส่งข้อความ error ของ Google ต่อให้เบราว์เซอร์ (อาจมีรายละเอียดบัญชี)
      throw new GeminiUnavailableError(`Gemini answered ${res.status}`);
    }

    const body = (await res.json().catch(() => null)) as GenerateContentResponse | null;
    if (body?.candidates?.[0]?.finishReason === "MAX_TOKENS") {
      // คำตอบถูกตัดกลางคัน (เช่น จบที่ "•") — ลองรุ่นถัดไปแทนการส่งคำตอบครึ่งเดียว
      console.warn(`[gemini] ${model} ran out of output tokens, trying the next model`);
      continue;
    }
    const text = body?.candidates?.[0]?.content?.parts
      ?.filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
      .trim();
    if (!text) throw new GeminiUnavailableError("Gemini answered without text");
    return text;
  }

  throw new GeminiUnavailableError("No Gemini model could answer");
}
