import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AssistantAnswerService } from '../src/assistant/assistant-answer.service';
import {
  FACULTY_EXPERTISE,
  facultyForTags,
  recommendedLecturers,
} from '../src/assistant/faculty-expertise';
import { bootApp, resetDatabase } from './helpers/boot-app';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { FakeGemini } from './helpers/fake-gemini';
import { createSigningKey, signCoreHubToken } from './helpers/token-factory';

const FACULTY_ID = FACULTY_EXPERTISE[0].id;
const FAKE_KEY = 'test-gemini-key';

describe('AI assistant answers new questions (e2e)', () => {
  let app: NestExpressApplication;
  let coreHub: FakeCoreHub;
  let gemini: FakeGemini;
  let student = '';
  let other = '';

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function ask(token: string, title: string, body: string, tags?: string[]): Promise<string> {
    const res = await http()
      .post('/api/v1/questions')
      .set(as(token))
      .send({ title, body, ...(tags ? { tags } : {}) })
      .expect(201);
    return res.body.data.id as string;
  }

  /** The assistant writes in the background after POST /questions; wait for it instead of sleeping. */
  const settle = () => app.get(AssistantAnswerService).idle();

  async function detail(id: string) {
    const res = await http().get(`/api/v1/questions/${id}`).set(as(student)).expect(200);
    return res.body.data;
  }

  /** An earlier question that already has an answer from a person. */
  async function answeredQuestion(): Promise<string> {
    gemini.behaviour = { kind: 'status', status: 503 };
    const id = await ask(student, 'รัน MongoDB ไม่ขึ้น connection refused', 'เปิด service แล้วยังต่อไม่ได้');
    await settle();
    await http()
      .post(`/api/v1/questions/${id}/comments`)
      .set(as(other))
      .send({ body: 'ลองสั่ง mongod ก่อนครับ แล้วเช็กพอร์ต 27017' })
      .expect(201);
    gemini.calls = [];
    return id;
  }

  beforeAll(async () => {
    const key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);
    gemini = new FakeGemini();
    await gemini.start();

    student = await signCoreHubToken(key, { sub: 'user-002', email: 'student@core.local', role: 'student' });
    other = await signCoreHubToken(key, { sub: 'user-102', email: 'other@core.local', role: 'student' });

    app = await bootApp({
      CORE_HUB_URL: coreHub.url,
      CORE_HUB_JWKS_URL: coreHub.jwksUrl,
      GEMINI_API_KEY: FAKE_KEY,
      GEMINI_API_URL: gemini.url,
      GEMINI_MODELS: 'model-a,model-b',
    });
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
    await gemini?.stop();
  });

  beforeEach(async () => {
    await resetDatabase(app);
    gemini.calls = [];
  });

  it('answers a repeated question with the earlier thread and a lecturer', async () => {
    const earlier = await answeredQuestion();
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({
        answer: 'เคยมีคนถามแล้วครับ • สั่ง mongod ก่อน',
        repeatOfIds: [earlier, 'not-a-candidate'],
        recommendedFacultyIds: [FACULTY_ID, 'made-up'],
      }),
    };

    const id = await ask(other, 'MongoDB ต่อไม่ได้ connection refused', 'ทำยังไงดีครับ');
    await settle();

    const question = await detail(id);
    expect(question.tags).toContain('Database');
    expect(question.comments).toHaveLength(1);
    expect(question.comments[0]).toEqual(
      expect.objectContaining({
        body: 'เคยมีคนถามแล้วครับ • สั่ง mongod ก่อน',
        author: expect.objectContaining({ isAssistant: true, personCode: null }),
        // the AI pick first, then everyone the question's tags point at; 'made-up' dropped
        recommendedFacultyIds: recommendedLecturers([FACULTY_ID], facultyForTags(question.tags)),
        relatedQuestions: [{ id: earlier, title: 'รัน MongoDB ไม่ขึ้น connection refused' }],
        isVerified: false,
      }),
    );

    // The key goes in a header, and the prompt carries no identity of anyone.
    const call = gemini.calls[0];
    expect(call.model).toBe('model-a');
    expect(call.apiKey).toBe(FAKE_KEY);
    expect(call.rawBody).not.toMatch(/user-002|user-102|6599|core_user_id|coreUserId/);
    expect(call.prompt.earlierQuestions).toEqual([expect.objectContaining({ id: earlier })]);
  });

  it('answers a brand-new question too, and recommends every lecturer its tags point at', async () => {
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({ answer: 'เริ่มจากบอร์ด ESP32 ครับ', repeatOfIds: [], recommendedFacultyIds: [] }),
    };

    const id = await ask(student, 'โปรเจกต์วัดความชื้นดิน', 'ควรเริ่มจากบอร์ดอะไรดี', ['IoT']);
    await settle();

    const [aiAnswer] = (await detail(id)).comments;
    const byTags = facultyForTags(['IoT']);
    expect(aiAnswer).toEqual(
      expect.objectContaining({
        body: 'เริ่มจากบอร์ด ESP32 ครับ',
        relatedQuestions: [],
        recommendedFacultyIds: byTags.map((f) => f.id),
      }),
    );
    expect(byTags.length).toBeGreaterThan(1);
    // The answer has to cover what the tags ask about.
    expect(gemini.calls[0].prompt.newQuestion).toEqual(expect.objectContaining({ tags: ['IoT'] }));
    // Gemini saw the lecturers the tags point at.
    expect(gemini.calls[0].prompt.suggestedByTags).toEqual(
      byTags.map((f) => ({ id: f.id, expertise: f.expertise })),
    );
  });

  it('keeps a question in "unanswered" until a person answers it', async () => {
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({ answer: 'คำตอบจาก AI', repeatOfIds: [], recommendedFacultyIds: [] }),
    };
    const id = await ask(other, 'ยังไม่มีคนตอบ', 'มีแค่ AI ตอบ');
    await settle();
    expect((await detail(id)).comments).toHaveLength(1);

    const unanswered = async () =>
      (await http().get('/api/v1/questions?unanswered=true').set(as(student)).expect(200)).body.data.map(
        (q: { id: string }) => q.id,
      );
    expect(await unanswered()).toEqual([id]);

    await http().post(`/api/v1/questions/${id}/comments`).set(as(student)).send({ body: 'ตอบโดยคน' }).expect(201);
    expect(await unanswered()).toEqual([]);
  });

  it('answers once per question', async () => {
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({ answer: 'ตอบครั้งเดียว', repeatOfIds: [], recommendedFacultyIds: [] }),
    };
    const id = await ask(other, 'MongoDB ต่อไม่ได้', 'ช่วยด้วย');
    await settle();
    await expect(app.get(AssistantAnswerService).answer(id)).resolves.toBe(false);
    expect((await detail(id)).comments).toHaveLength(1);
  });

  it('drops a lecturer id that is not in the directory', async () => {
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({ answer: 'ตอบ', repeatOfIds: [], recommendedFacultyIds: ['made-up'] }),
    };
    const id = await ask(other, 'คำถามทั่วไป', 'ไม่มีแท็กที่ตรงกับอาจารย์คนไหน', ['General']);
    await settle();
    expect((await detail(id)).comments[0].recommendedFacultyIds).toEqual([]);
  });

  it('writes nothing when Gemini gives no answer', async () => {
    gemini.behaviour = {
      kind: 'verdict',
      verdict: () => ({ answer: '  ', repeatOfIds: [], recommendedFacultyIds: [] }),
    };
    const id = await ask(other, 'คำถาม', 'รายละเอียด');
    await settle();
    expect((await detail(id)).comments).toEqual([]);
  });

  it('tries the next model when one is busy, and never fails the question', async () => {
    gemini.behaviour = { kind: 'status', status: 503 };
    const id = await ask(other, 'MongoDB ต่อไม่ได้', 'ช่วยด้วย');
    await settle();

    expect(gemini.calls.map((c) => c.model)).toEqual(['model-a', 'model-b']);
    expect((await detail(id)).comments).toEqual([]);
  });
});
