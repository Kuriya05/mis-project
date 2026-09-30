// @vitest-environment jsdom
import axios from "axios";
import { describe, expect, it } from "vitest";
import type { QuestionDetail, QuestionSummary, SuccessEnvelope, Tag } from "../types";
import { demoAdapter } from "./adapter";
import { DEMO_USER_ID } from "./profile";

const api = axios.create({ adapter: demoAdapter });
const ANON_QUESTION = "5eed0000-0000-4000-8000-000000000001";
const OWN_QUESTION = "5eed0000-0000-4000-8000-000000000002";

async function list(params: Record<string, unknown> = {}) {
  const res = await api.get<SuccessEnvelope<QuestionSummary[]>>("/api/v1/questions", { params });
  return res.data;
}

describe("demo adapter", () => {
  it("lists the sample questions newest first with page meta", async () => {
    const body = await list();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(5);
    expect(body.data[0].id).toBe(ANON_QUESTION);
    expect(body.meta?.total).toBe(5);
  });

  it("filters like the backend", async () => {
    expect((await list({ tag: "Java" })).data.map((q) => q.tags)).toEqual([["Java", "Error"]]);
    expect((await list({ unanswered: true })).data).toHaveLength(1);
    expect((await list({ status: "RESOLVED" })).data).toHaveLength(2);
    expect((await list({ mine: true })).data.every((q) => q.author.id === DEMO_USER_ID)).toBe(true);
    expect((await list({ q: "useeffect" })).data).toHaveLength(1);
  });

  it("returns popular tags", async () => {
    const res = await api.get<SuccessEnvelope<Tag[]>>("/api/v1/tags", { params: { limit: 2 } });
    expect(res.data.data).toHaveLength(2);
    expect(res.data.data[0].questionCount).toBeGreaterThanOrEqual(res.data.data[1].questionCount);
  });

  it("creates a question, answers it, votes and verifies the answer", async () => {
    const created = await api.post<SuccessEnvelope<QuestionDetail>>("/api/v1/questions", {
      title: "React hooks ใช้ยังไง",
      body: "สงสัยเรื่อง useState",
      tags: [],
    });
    const id = created.data.data.id;
    expect(created.status).toBe(201);
    expect(created.data.data.tags).toEqual(["React"]);

    const answer = await api.post(`/api/v1/questions/${id}/comments`, { body: "ลองอ่านเอกสาร" });
    const answerId = answer.data.data.id;
    await api.post(`/api/v1/questions/${id}/comments`, { body: "ขอบคุณครับ", parentId: answerId });

    const vote = await api.post(`/api/v1/questions/${id}/votes`);
    expect(vote.data.data).toMatchObject({ voteCount: 1, hasVoted: true });

    await api.post(`/api/v1/comments/${answerId}/verification`);
    const detail = await api.get<SuccessEnvelope<QuestionDetail>>(`/api/v1/questions/${id}`);
    expect(detail.data.data.status).toBe("RESOLVED");
    expect(detail.data.data.comments[0].replies).toHaveLength(1);
  });

  it("answers with the error envelope the UI maps to Thai messages", async () => {
    await expect(api.delete(`/api/v1/questions/${ANON_QUESTION}`)).rejects.toMatchObject({
      response: { status: 403, data: { success: false, error: { code: "FORBIDDEN" } } },
    });
    await expect(api.patch(`/api/v1/questions/${OWN_QUESTION}`, { title: " " })).rejects.toMatchObject({
      response: { status: 400, data: { error: { code: "VALIDATION_ERROR", details: { field: "title" } } } },
    });
    await expect(api.get("/api/v1/questions/missing")).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("renames the demo user on the board", async () => {
    const res = await api.patch("/api/v1/profiles/me", { displayName: "ชื่อใหม่" });
    expect(res.data.data.displayName).toBe("ชื่อใหม่");
    const mine = await list({ mine: true });
    expect(mine.data[0].author.displayName).toBe("ชื่อใหม่");
  });
});
