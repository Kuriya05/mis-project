import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { bootApp, resetDatabase } from './helpers/boot-app';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { createSigningKey, signCoreHubToken } from './helpers/token-factory';

const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Bookmarks, activity and stats (e2e)', () => {
  let app: NestExpressApplication;
  let coreHub: FakeCoreHub;
  const tokens: Record<'student' | 'other' | 'lecturer' | 'alumni', string> = {
    student: '',
    other: '',
    lecturer: '',
    alumni: '',
  };

  const http = () => request(app.getHttpServer());
  const as = (who: keyof typeof tokens) => ({ Authorization: `Bearer ${tokens[who]}` });

  async function ask(who: keyof typeof tokens, title = 'คำถาม', tags?: string[]) {
    const res = await http()
      .post('/api/v1/questions')
      .set(as(who))
      .send({ title, body: 'รายละเอียด', ...(tags ? { tags } : {}) })
      .expect(201);
    return res.body.data as { id: string };
  }

  async function answer(who: keyof typeof tokens, questionId: string, body = 'คำตอบ', parentId?: string) {
    const res = await http()
      .post(`/api/v1/questions/${questionId}/comments`)
      .set(as(who))
      .send({ body, ...(parentId ? { parentId } : {}) })
      .expect(201);
    return res.body.data as { id: string };
  }

  beforeAll(async () => {
    const key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);
    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;

    const sign = (sub: string, role: string) => signCoreHubToken(key, { sub, email: `${sub}@core.local`, role });
    tokens.student = await sign('user-002', 'student');
    tokens.other = await sign('user-102', 'student');
    tokens.lecturer = await sign('user-005', 'lecturer');
    tokens.alumni = await sign('user-004', 'alumni');

    app = await bootApp();
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  describe('bookmarks', () => {
    it('saves a question for the caller only, and lists it in the bookmarked tab', async () => {
      const saved = await ask('other', 'บันทึกไว้อ่าน');
      await ask('other', 'ไม่ได้บันทึก');

      const res = await http().post(`/api/v1/questions/${saved.id}/bookmark`).set(as('student')).expect(201);
      expect(res.body.data).toEqual({ id: saved.id, isBookmarked: true });
      // saving twice keeps one bookmark
      await http().post(`/api/v1/questions/${saved.id}/bookmark`).set(as('student')).expect(201);

      const mine = await http().get('/api/v1/questions?bookmarked=true').set(as('student')).expect(200);
      expect(mine.body.data.map((q: { id: string }) => q.id)).toEqual([saved.id]);
      expect(mine.body.data[0].isBookmarked).toBe(true);

      const theirs = await http().get('/api/v1/questions?bookmarked=true').set(as('other')).expect(200);
      expect(theirs.body.data).toEqual([]);
      const detail = await http().get(`/api/v1/questions/${saved.id}`).set(as('other')).expect(200);
      expect(detail.body.data.isBookmarked).toBe(false);

      await http().delete(`/api/v1/questions/${saved.id}/bookmark`).set(as('student')).expect(200);
      const after = await http().get('/api/v1/questions?bookmarked=true').set(as('student')).expect(200);
      expect(after.body.data).toEqual([]);
    });

    it('lets read-only alumni bookmark, and answers 404 for an unknown question', async () => {
      const q = await ask('student');
      await http().post(`/api/v1/questions/${q.id}/bookmark`).set(as('alumni')).expect(201);
      await http().post(`/api/v1/questions/${UNKNOWN_ID}/bookmark`).set(as('student')).expect(404);
      await http().post(`/api/v1/questions/${q.id}/bookmark`).expect(401);
    });
  });

  describe('my activity', () => {
    it('lists what others wrote on my questions, newest first, and counts the unread', async () => {
      const mine = await ask('student', 'กระทู้ของฉัน');
      const notMine = await ask('other', 'กระทู้ของคนอื่น');
      const first = await answer('other', mine.id, 'คำตอบแรก');
      await answer('student', mine.id, 'ฉันตอบเอง');
      await answer('lecturer', notMine.id, 'ไม่เกี่ยวกับฉัน');
      await answer('student', mine.id, 'ฉันตอบกลับ', first.id);
      // only the question's author may reply under an answer, so others show up as answers
      const second = await answer('lecturer', mine.id, 'อาจารย์ตอบ');

      const res = await http().get('/api/v1/profiles/me/activity').set(as('student')).expect(200);
      expect(res.body.data.unreadCount).toBe(2);
      expect(res.body.data.items).toEqual([
        expect.objectContaining({ id: second.id, kind: 'answer', questionTitle: 'กระทู้ของฉัน', isNew: true }),
        expect.objectContaining({
          id: first.id,
          kind: 'answer',
          excerpt: 'คำตอบแรก',
          author: expect.objectContaining({ coreRole: 'student', isAssistant: false }),
        }),
      ]);
    });

    it('counts again from zero once marked as seen', async () => {
      const mine = await ask('student');
      await answer('other', mine.id);
      await http().post('/api/v1/profiles/me/activity/seen').set(as('student')).expect(200);

      let res = await http().get('/api/v1/profiles/me/activity').set(as('student')).expect(200);
      expect(res.body.data.unreadCount).toBe(0);
      expect(res.body.data.items[0].isNew).toBe(false);

      await answer('lecturer', mine.id, 'คำตอบใหม่');
      res = await http().get('/api/v1/profiles/me/activity').set(as('student')).expect(200);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.items[0]).toEqual(expect.objectContaining({ excerpt: 'คำตอบใหม่', isNew: true }));
    });
  });

  describe('stats', () => {
    it('sums up the board, its tags and its top helpers', async () => {
      const q1 = await ask('student', 'ฐานข้อมูล', ['Database']);
      const q2 = await ask('student', 'ฐานข้อมูลอีก', ['Database', 'NestJS']);
      await ask('other', 'react', ['React']);
      const a1 = await answer('lecturer', q1.id);
      await answer('lecturer', q2.id);
      await answer('other', q2.id);
      await answer('student', q1.id, 'ขอบคุณครับ', a1.id); // a reply is not an answer
      await http().post(`/api/v1/comments/${a1.id}/verification`).set(as('student')).expect(201);

      const res = await http().get('/api/v1/stats').set(as('alumni')).expect(200);
      const stats = res.body.data;
      expect(stats.totals).toEqual({ questions: 3, resolved: 1, answers: 3, assistantAnswers: 0 });
      expect(stats.topTags[0]).toEqual({ name: 'Database', count: 2 });
      expect(stats.topHelpers[0]).toEqual(
        expect.objectContaining({ answers: 2, verifiedAnswers: 1, author: expect.objectContaining({ coreRole: 'lecturer' }) }),
      );
      expect(stats.weekly).toHaveLength(8);
      expect(stats.weekly.at(-1)).toEqual(expect.objectContaining({ questions: 3, answers: 3 }));
    });

    it('needs a token', async () => {
      await http().get('/api/v1/stats').expect(401);
    });
  });
});
