import { NextResponse } from "next/server";

// POST /assistant/chat — ส่งคำถามที่บอทวิชาการตอบเองไม่ได้ไปถาม OpenAI (ทดลองในเครื่องเท่านั้น)
// key อยู่ฝั่ง server ใน frontend/.env.local (OPENAI_API_KEY) ห้ามตั้งเป็น NEXT_PUBLIC_*
// ไม่อยู่ใต้ /api เพราะ next.config.ts ส่ง /api/* ต่อไปที่ backend

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MAX_QUESTION_LENGTH = 1000;

const SYSTEM_PROMPT = [
  "คุณคือผู้ช่วยวิชาการของสาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้ (CSMJU Helpdesk)",
  "ตอบเป็นภาษาไทย สุภาพ กระชับ ไม่เกิน 6 บรรทัด ขึ้นบรรทัดด้วย • ได้ ใช้ **ตัวหนา** เฉพาะคำสำคัญ 1–3 คำ ห้ามทำตัวหนาทั้งประโยค",
  "ช่วยเรื่องการเรียน การเขียนโปรแกรม และการใช้ชีวิตนักศึกษา",
  "ถ้าเป็นข้อมูลเฉพาะของมหาวิทยาลัยที่ไม่แน่ใจ (วันที่ ค่าเทอม ระเบียบ) ห้ามเดา ให้แนะนำติดต่อสาขาวิชาหรือตั้งกระทู้ถามอาจารย์บนเว็บบอร์ด",
].join("\n");

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "OPENAI_API_KEY is not set" } },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { question?: unknown } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "question is required", details: { field: "question" } } },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        max_tokens: 500,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!res.ok) {
      // ไม่ส่งข้อความ error ของ OpenAI ต่อให้เบราว์เซอร์ (อาจมีรายละเอียดบัญชี) — ดูใน log ของ server แทน
      console.error("[assistant] OpenAI", res.status, (await res.text()).slice(0, 300));
      return NextResponse.json(
        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Assistant is unavailable" } },
        { status: 503 },
      );
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error("empty answer");
    return NextResponse.json({ success: true, data: { answer } });
  } catch (err) {
    console.error("[assistant]", err);
    return NextResponse.json(
      { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Assistant is unavailable" } },
      { status: 503 },
    );
  }
}
