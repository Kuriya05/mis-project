import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_QUICK_REPLIES, KNOWLEDGE_PROMPTS, getBotReplies, preparedAnswerText } from "./academic-bot";

// ปุ่มบนการ์ดในแชทส่งข้อความเหล่านี้ (components/features/assistant/EduCarousel.tsx)
const CARD_PROMPTS = [
  "[หลักสูตร วิทยาการคอมพิวเตอร์ (รหัส 70)]",
  "[ค่าเทอม วิทยาการคอมพิวเตอร์]",
  "[ทุนปันน้ำใจพี่ให้น้อง]",
  "[ปฏิทินการศึกษา MJU]",
  "[การขอผ่อนผันทหาร]",
  "[ประกันอุบัติเหตุ]",
];

const BUTTONS = [...new Set([...CARD_PROMPTS, ...DEFAULT_QUICK_REPLIES, ...KNOWLEDGE_PROMPTS])];

/** แทน fetch ของเบราว์เซอร์: /assistant/chat ตอบตาม answer (null = AI ใช้ไม่ได้) */
function stubAssistant(answer: string | null) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
    answer === null
      ? new Response(JSON.stringify({ success: false }), { status: 503 })
      : new Response(JSON.stringify({ success: true, data: { answer } }), { status: 200 }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("academic bot", () => {
  it.each(BUTTONS)("answers the button %s with prepared text, without asking the AI", async (prompt) => {
    const fetchMock = stubAssistant("ไม่ควรถูกเรียก");
    const replies = await getBotReplies(prompt);
    expect(replies.some((r) => typeof r.text === "string" && r.text.length > 20)).toBe(true);
    expect(replies.some((r) => r.text?.startsWith("ขออภัยครับ บอทวิชาการยังไม่เข้าใจ"))).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // แชทเลื่อนลงล่างสุดหลังบอทตอบ ถ้าคำตอบลงท้ายด้วยการ์ดชุดเดิมอีกครั้ง
  // ผู้ใช้จะเห็นแค่การ์ดซ้ำ และคำตอบด้านบนหลุดจากจอ ดูเหมือนกดแล้วไม่มีอะไรตอบ
  it.each(CARD_PROMPTS)("does not end the answer to %s with the cards again", async (prompt) => {
    const replies = await getBotReplies(prompt);
    expect(replies.at(-1)?.isEduCarousel).not.toBe(true);
  });

  it("gives the AI every prepared topic as reference", async () => {
    for (const prompt of KNOWLEDGE_PROMPTS) {
      expect((await preparedAnswerText(prompt)).length).toBeGreaterThan(20);
    }
  });

  it("sends a typed question to the AI with the conversation so far", async () => {
    const fetchMock = stubAssistant("ทุนนี้สมัครผ่านระบบของมหาวิทยาลัยครับ");
    const replies = await getBotReplies("แล้วทุนนี้สมัครยังไง", [
      { role: "user", text: "[ทุนปันน้ำใจพี่ให้น้อง]" },
      { role: "assistant", text: "ทุนปันน้ำใจพี่ให้น้อง ครั้งที่ 5" },
    ]);

    expect(replies).toEqual([{ sender: "bot", text: "ทุนนี้สมัครผ่านระบบของมหาวิทยาลัยครับ", fromAssistant: true }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/assistant/chat");
    expect(JSON.parse(String(init?.body))).toEqual({
      question: "แล้วทุนนี้สมัครยังไง",
      history: [
        { role: "user", text: "[ทุนปันน้ำใจพี่ให้น้อง]" },
        { role: "assistant", text: "ทุนปันน้ำใจพี่ให้น้อง ครั้งที่ 5" },
      ],
    });
  });

  it("falls back to the prepared answer when the AI is unavailable", async () => {
    stubAssistant(null);
    const replies = await getBotReplies("ค่าเทอมเท่าไหร่ครับ");
    expect(replies.some((r) => r.text?.includes("20,000"))).toBe(true);
    expect(replies.some((r) => r.fromAssistant)).toBe(false);
  });

  it("says what it can help with when neither the AI nor a topic fits", async () => {
    stubAssistant(null);
    const replies = await getBotReplies("วันนี้ฝนตกไหม");
    expect(replies[0].text).toMatch(/^ขออภัยครับ บอทวิชาการยังไม่เข้าใจ/);
  });
});
