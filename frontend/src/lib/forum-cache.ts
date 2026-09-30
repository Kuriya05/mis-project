import { api } from "./api";
import type { QuestionSummary, SuccessEnvelope } from "./types";

/** จำนวนกระทู้ต่อครั้ง (สูงสุดที่ API ให้ต่อหน้า) */
export const FORUM_PAGE_SIZE = 100;

export interface QuestionQuery {
  q?: string;
  tag?: string;
  mine?: boolean;
  status?: "WAITING" | "RESOLVED";
  unanswered?: boolean;
}

export interface QuestionPage {
  items: QuestionSummary[];
  total: number;
}

// cache รายการกระทู้ระดับโมดูล: อยู่รอดเมื่อกดเข้าไปดูกระทู้แล้วกลับมา
// key = พารามิเตอร์ที่ส่งไป API และรวม request ซ้ำที่กำลังโหลดให้เหลือครั้งเดียว
export const forumCache = new Map<string, QuestionPage>();
const inflight = new Map<string, Promise<QuestionPage>>();

export function questionQueryKey(params: QuestionQuery): string {
  return JSON.stringify(params);
}

export function loadQuestions(params: QuestionQuery): Promise<QuestionPage> {
  const key = questionQueryKey(params);
  let request = inflight.get(key);
  if (!request) {
    request = api
      .get<SuccessEnvelope<QuestionSummary[]>>("/api/v1/questions", {
        params: { ...params, limit: FORUM_PAGE_SIZE },
      })
      .then((res) => {
        const page = { items: res.data.data, total: res.data.meta?.total ?? res.data.data.length };
        forumCache.set(key, page);
        return page;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, request);
  }
  return request;
}

/** เรียกหลังสร้าง/แก้ไข/ลบกระทู้ เพื่อไม่ให้หน้ารวมกระทู้แสดงข้อมูลเก่า */
export function invalidateForumCache(): void {
  forumCache.clear();
}
