import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { bootApp, resetDatabase } from './helpers/boot-app';
import { FakeCoreHub } from './helpers/fake-core-hub';
import { TestSigningKey, createSigningKey, signCoreHubToken } from './helpers/token-factory';

const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

describe('Helpdesk API (e2e)', () => {
  let app: NestExpressApplication;
  let coreHub: FakeCoreHub;
  let key: TestSigningKey;
  const tokens: Record<
    'student' | 'other' | 'staff' | 'admin' | 'alumni' | 'lecturer' | 'guest',
    string
  > = {
    student: '',
    other: '',
    staff: '',
    admin: '',
    alumni: '',
    lecturer: '',
    guest: '',
  };

  const http = () => request(app.getHttpServer());
  const as = (who: keyof typeof tokens) => ({ Authorization: `Bearer ${tokens[who]}` });

  async function ask(who: keyof typeof tokens, body: Record<string, unknown> = {}) {
    const res = await http()
      .post('/api/v1/questions')
      .set(as(who))
      .send({ title: 'NestJS ต่อ PostgreSQL ไม่ได้', body: 'connection refused ตลอด', ...body })
      .expect(201);
    return res.body.data;
  }

  async function answer(who: keyof typeof tokens, questionId: string, body = 'ลองเช็ค service ดูครับ') {
    const res = await http()
      .post(`/api/v1/questions/${questionId}/comments`)
      .set(as(who))
      .send({ body })
      .expect(201);
    return res.body.data;
  }

  beforeAll(async () => {
    key = await createSigningKey('core-hub-2026');
    coreHub = new FakeCoreHub();
    await coreHub.start([key]);
    process.env.CORE_HUB_URL = coreHub.url;
    process.env.CORE_HUB_JWKS_URL = coreHub.jwksUrl;

    const sign = (sub: string, email: string, role: string) =>
      signCoreHubToken(key, { sub, email, role });
    tokens.student = await sign('user-002', 'student@core.local', 'student');
    tokens.other = await sign('user-102', 'somchai@core.local', 'student');
    tokens.staff = await sign('user-003', 'staff@core.local', 'staff');
    tokens.admin = await sign('user-001', 'admin@core.local', 'admin');
    tokens.alumni = await sign('user-004', 'alumni@core.local', 'alumni');
    tokens.lecturer = await sign('user-005', 'lecturer@core.local', 'lecturer');
    tokens.guest = await sign('user-006', 'guest@core.local', 'guest');

    // Only the student's account is linked to a person in Core Hub.
    coreHub.setPeople({
      'user-002': { personCode: '6599000002', firstName: 'ไม่ถูกเก็บ', email: 'student@core.local' },
    });

    app = await bootApp();
  });

  afterAll(async () => {
    await app?.close();
    await coreHub?.stop();
  });

  beforeEach(async () => {
    await resetDatabase(app);
  });

  describe('authentication and envelope', () => {
    it('answers 401 UNAUTHORIZED without a token', async () => {
      const res = await http().get('/api/v1/questions').expect(401);
      expect(res.body).toEqual({
        success: false,
        error: expect.objectContaining({ code: 'UNAUTHORIZED' }),
      });
    });

    it('lists an empty board as data [] with meta', async () => {
      const res = await http().get('/api/v1/questions').set(as('student')).expect(200);
      expect(res.body).toEqual({
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });
    });

    it('rejects a malformed id with 400 and an unknown id with 404 NOT_FOUND', async () => {
      await http().get('/api/v1/questions/not-a-uuid').set(as('student')).expect(400);
      const res = await http().get(`/api/v1/questions/${UNKNOWN_ID}`).set(as('student')).expect(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('rejects bad query parameters with 400 VALIDATION_ERROR', async () => {
      for (const query of ['limit=abc', 'limit=101', 'status=done', 'mine=yes']) {
        const res = await http().get(`/api/v1/questions?${query}`).set(as('student')).expect(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('profiles', () => {
    it('creates the profile on first sight with person_code from Core Hub and no name', async () => {
      const res = await http().get('/api/v1/profiles/me').set(as('student')).expect(200);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          coreUserId: 'user-002',
          personCode: '6599000002',
          coreRole: 'student',
          subsystemRole: 'STUDENT',
          permissions: expect.arrayContaining(['question:create']),
          session: { expiresAt: expect.any(String) },
        }),
      );
      expect(res.body.data).not.toHaveProperty('displayName');
      expect(coreHub.lastPeopleAuthorization).toBe(`Bearer ${tokens.student}`);
    });

    it('asks Core Hub only until person_code is known', async () => {
      await http().get('/api/v1/profiles/me').set(as('student')).expect(200);
      const calls = coreHub.peopleRequests;
      await http().get('/api/v1/profiles/me').set(as('student')).expect(200);
      expect(coreHub.peopleRequests).toBe(calls);
    });

    it('leaves person_code null for an account linked to no person', async () => {
      const res = await http().get('/api/v1/profiles/me').set(as('other')).expect(200);
      expect(res.body.data.personCode).toBeNull();
    });

    it('still answers while Core Hub cannot, and shows the role instead', async () => {
      coreHub.peopleFailure = { status: 503 };
      try {
        const res = await http().get('/api/v1/profiles/me').set(as('student')).expect(200);
        expect(res.body.data.personCode).toBeNull();
      } finally {
        coreHub.peopleFailure = null;
      }
    });

    it('accepts every Core Hub role: lecturer as staff, guest as read-only', async () => {
      const lecturer = await http().get('/api/v1/profiles/me').set(as('lecturer')).expect(200);
      expect(lecturer.body.data).toEqual(
        expect.objectContaining({ coreRole: 'lecturer', subsystemRole: 'STAFF' }),
      );

      const guest = await http().get('/api/v1/profiles/me').set(as('guest')).expect(200);
      expect(guest.body.data).toEqual(
        expect.objectContaining({ coreRole: 'guest', subsystemRole: 'ALUMNI', personCode: null }),
      );
      await http()
        .post('/api/v1/questions')
        .set(as('guest'))
        .send({ title: 'ถามได้ไหม', body: 'ผู้เยี่ยมชม' })
        .expect(403);
    });

    it('has no endpoint to rename yourself', async () => {
      await http().patch('/api/v1/profiles/me').set(as('student')).send({ displayName: 'x' }).expect(404);
    });
  });

  describe('questions', () => {
    it('creates a question and suggests tags when none are given', async () => {
      const q = await ask('student');
      expect(q).toEqual(
        expect.objectContaining({
          title: 'NestJS ต่อ PostgreSQL ไม่ได้',
          status: 'WAITING',
          tags: ['Database', 'Error', 'NestJS'],
          author: { id: expect.any(String), personCode: '6599000002', coreRole: 'student', isAssistant: false },
          voteCount: 0,
          hasVoted: false,
          commentCount: 0,
          comments: [],
          editedAt: null,
        }),
      );
      expect(q.createdAt).toMatch(/Z$/);
    });

    it('normalises tags and reuses an existing tag whatever its letter case', async () => {
      await ask('student', { tags: ['React'] });
      const q = await ask('other', { tags: ['#react', 'next js', 'REACT'] });
      expect(q.tags).toEqual(['React', 'next-js']);

      const tags = await http().get('/api/v1/tags').set(as('student')).expect(200);
      expect(tags.body.data).toEqual([
        { name: 'React', questionCount: 2 },
        { name: 'next-js', questionCount: 1 },
      ]);
    });

    it('validates the body of a new question', async () => {
      for (const body of [
        { title: '', body: 'x' },
        { title: 'x', body: '   ' },
        { title: 'x'.repeat(151), body: 'x' },
        { title: 'x', body: 'x', tags: ['a', 'b', 'c', 'd', 'e', 'f'] },
        { title: 'x', body: 'x', status: 'RESOLVED' },
      ]) {
        const res = await http().post('/api/v1/questions').set(as('student')).send(body).expect(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('keeps alumni read-only (403 FORBIDDEN) but lets them read', async () => {
      await ask('student');
      const res = await http()
        .post('/api/v1/questions')
        .set(as('alumni'))
        .send({ title: 'x', body: 'x' })
        .expect(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      const list = await http().get('/api/v1/questions').set(as('alumni')).expect(200);
      expect(list.body.meta.total).toBe(1);
    });

    it('filters by search text, tag, status, mine and unanswered', async () => {
      const mine = await ask('student', { title: 'useEffect วนไม่หยุด', body: 'ช่วยด้วย', tags: ['React'] });
      const other = await ask('other', { title: 'Java loop', body: 'IndexOutOfBounds', tags: ['Java'] });
      await answer('staff', other.id);

      const ids = async (query: string, who: keyof typeof tokens = 'student') =>
        (await http().get(`/api/v1/questions?${query}`).set(as(who)).expect(200)).body.data.map(
          (q: { id: string }) => q.id,
        );

      expect(await ids('q=useeffect')).toEqual([mine.id]);
      expect(await ids('q=java')).toEqual([other.id]);
      expect(await ids('tag=java')).toEqual([other.id]);
      expect(await ids('mine=true')).toEqual([mine.id]);
      expect(await ids('unanswered=true')).toEqual([mine.id]);
      expect(await ids('status=RESOLVED')).toEqual([]);
      expect(await ids('')).toEqual([other.id, mine.id]);

      const page = await http().get('/api/v1/questions?page=2&limit=1').set(as('student')).expect(200);
      expect(page.body.data.map((q: { id: string }) => q.id)).toEqual([mine.id]);
      expect(page.body.meta).toEqual({ total: 2, page: 2, limit: 1, totalPages: 2 });
    });

    it('sorts by popularity: most votes, then most answers, then newest', async () => {
      // created oldest to newest, so popularity has to reverse the default order
      const voted = await ask('student', { title: 'กระทู้ยอดนิยม', body: 'มีคนโหวต' });
      const answered = await ask('student', { title: 'กระทู้มีคนตอบ', body: 'มีคำตอบสองข้อ' });
      const quiet = await ask('student', { title: 'กระทู้เงียบ', body: 'ยังไม่มีใครสนใจ' });
      await answer('staff', answered.id);
      await answer('other', answered.id);
      await http().post(`/api/v1/questions/${voted.id}/votes`).set(as('other')).expect(201);

      const ids = async (query: string) =>
        (await http().get(`/api/v1/questions?${query}`).set(as('student')).expect(200)).body.data.map(
          (q: { id: string }) => q.id,
        );
      expect(await ids('sort=popular')).toEqual([voted.id, answered.id, quiet.id]);
      expect(await ids('sort=newest')).toEqual([quiet.id, answered.id, voted.id]);
      expect(await ids('')).toEqual([quiet.id, answered.id, voted.id]);

      const bad = await http().get('/api/v1/questions?sort=random').set(as('student')).expect(400);
      expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('lets only the author (or admin) edit and delete', async () => {
      const q = await ask('student');

      await http().patch(`/api/v1/questions/${q.id}`).set(as('other')).send({ title: 'hack' }).expect(403);
      await http().patch(`/api/v1/questions/${q.id}`).set(as('staff')).send({ title: 'hack' }).expect(403);
      await http().delete(`/api/v1/questions/${q.id}`).set(as('other')).expect(403);

      const edited = await http()
        .patch(`/api/v1/questions/${q.id}`)
        .set(as('student'))
        .send({ title: 'แก้หัวข้อแล้ว', tags: ['Database'] })
        .expect(200);
      expect(edited.body.data).toEqual(
        expect.objectContaining({ title: 'แก้หัวข้อแล้ว', tags: ['Database'], editedAt: expect.any(String) }),
      );

      const removed = await http().delete(`/api/v1/questions/${q.id}`).set(as('admin')).expect(200);
      expect(removed.body).toEqual({ success: true, data: { id: q.id, deleted: true } });
      await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(404);
    });

    it('counts one vote per person and reports it per viewer', async () => {
      const q = await ask('student');
      const first = await http().post(`/api/v1/questions/${q.id}/votes`).set(as('other')).expect(201);
      expect(first.body.data).toEqual({ id: q.id, voteCount: 1, hasVoted: true });
      await http().post(`/api/v1/questions/${q.id}/votes`).set(as('other')).expect(201);
      await http().post(`/api/v1/questions/${q.id}/votes`).set(as('staff')).expect(201);

      const list = await http().get('/api/v1/questions').set(as('other')).expect(200);
      expect(list.body.data[0]).toEqual(expect.objectContaining({ voteCount: 2, hasVoted: true }));
      const byAuthor = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(byAuthor.body.data).toEqual(expect.objectContaining({ voteCount: 2, hasVoted: false }));

      const undone = await http().delete(`/api/v1/questions/${q.id}/votes`).set(as('other')).expect(200);
      expect(undone.body.data).toEqual({ id: q.id, voteCount: 1, hasVoted: false, deleted: true });

      await http().post(`/api/v1/questions/${q.id}/votes`).set(as('alumni')).expect(403);
      await http().post(`/api/v1/questions/${UNKNOWN_ID}/votes`).set(as('other')).expect(404);
    });
  });

  describe('answers and replies', () => {
    it('lets only the question author reply, one level deep', async () => {
      const q = await ask('student');
      const a = await answer('staff', q.id);

      const reply = await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('student'))
        .send({ body: 'ขอบคุณครับ', parentId: a.id })
        .expect(201);
      expect(reply.body.data).toEqual(expect.objectContaining({ parentId: a.id, isVerified: false }));

      await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('other'))
        .send({ body: 'แทรก', parentId: a.id })
        .expect(403);
      await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('student'))
        .send({ body: 'ซ้อน', parentId: reply.body.data.id })
        .expect(400);

      const other = await ask('other');
      const elsewhere = await answer('staff', other.id);
      await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('student'))
        .send({ body: 'ผิดกระทู้', parentId: elsewhere.id })
        .expect(400);

      const detail = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(detail.body.data.commentCount).toBe(2);
      expect(detail.body.data.comments).toHaveLength(1);
      expect(detail.body.data.comments[0].replies.map((r: { id: string }) => r.id)).toEqual([
        reply.body.data.id,
      ]);
    });

    it('lets only the comment author (or admin) edit and delete; deleting an answer drops its replies', async () => {
      const q = await ask('student');
      const a = await answer('staff', q.id);
      await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('student'))
        .send({ body: 'ขอบคุณครับ', parentId: a.id })
        .expect(201);

      await http().patch(`/api/v1/comments/${a.id}`).set(as('student')).send({ body: 'x' }).expect(403);
      const edited = await http()
        .patch(`/api/v1/comments/${a.id}`)
        .set(as('staff'))
        .send({ body: 'แก้แล้ว' })
        .expect(200);
      expect(edited.body.data).toEqual(
        expect.objectContaining({ body: 'แก้แล้ว', editedAt: expect.any(String) }),
      );

      await http().delete(`/api/v1/comments/${a.id}`).set(as('other')).expect(403);
      await http().delete(`/api/v1/comments/${a.id}`).set(as('staff')).expect(200);
      const detail = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(detail.body.data.commentCount).toBe(0);
    });

    it('orders answers: verified, then most voted, then newest', async () => {
      const q = await ask('student');
      const older = await answer('staff', q.id, 'เก่า');
      const voted = await answer('other', q.id, 'มีคนโหวต');
      const newest = await answer('admin', q.id, 'ใหม่สุด');
      await http().post(`/api/v1/comments/${voted.id}/votes`).set(as('student')).expect(201);
      await http().post(`/api/v1/comments/${older.id}/verification`).set(as('student')).expect(201);

      const detail = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(detail.body.data.comments.map((c: { id: string }) => c.id)).toEqual([
        older.id,
        voted.id,
        newest.id,
      ]);
      expect(detail.body.data.comments[1]).toEqual(
        expect.objectContaining({ voteCount: 1, hasVoted: true }),
      );
    });
  });

  describe('verification', () => {
    it('lets the question author or a teacher verify, never another student', async () => {
      const q = await ask('student');
      const a1 = await answer('other', q.id);
      const a2 = await answer('staff', q.id);

      await http().post(`/api/v1/comments/${a1.id}/verification`).set(as('other')).expect(403);

      const byAuthor = await http()
        .post(`/api/v1/comments/${a1.id}/verification`)
        .set(as('student'))
        .expect(201);
      expect(byAuthor.body.data).toEqual({
        id: a1.id,
        questionId: q.id,
        isVerified: true,
        questionStatus: 'RESOLVED',
      });

      // a teacher moves the mark to another answer; still one verified answer
      await http().post(`/api/v1/comments/${a2.id}/verification`).set(as('staff')).expect(201);
      const detail = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(detail.body.data.status).toBe('RESOLVED');
      expect(
        detail.body.data.comments.filter((c: { isVerified: boolean }) => c.isVerified).map(
          (c: { id: string }) => c.id,
        ),
      ).toEqual([a2.id]);

      const undone = await http()
        .delete(`/api/v1/comments/${a2.id}/verification`)
        .set(as('student'))
        .expect(200);
      expect(undone.body.data).toEqual(
        expect.objectContaining({ isVerified: false, questionStatus: 'WAITING', deleted: true }),
      );
    });

    it('refuses to verify a reply', async () => {
      const q = await ask('student');
      const a = await answer('staff', q.id);
      const reply = await http()
        .post(`/api/v1/questions/${q.id}/comments`)
        .set(as('student'))
        .send({ body: 'ขอบคุณ', parentId: a.id })
        .expect(201);
      await http()
        .post(`/api/v1/comments/${reply.body.data.id}/verification`)
        .set(as('staff'))
        .expect(400);
    });

    it('re-opens the question when the verified answer is deleted', async () => {
      const q = await ask('student');
      const a = await answer('staff', q.id);
      await http().post(`/api/v1/comments/${a.id}/verification`).set(as('student')).expect(201);
      await http().delete(`/api/v1/comments/${a.id}`).set(as('staff')).expect(200);

      const detail = await http().get(`/api/v1/questions/${q.id}`).set(as('student')).expect(200);
      expect(detail.body.data.status).toBe('WAITING');
    });
  });

  describe('tag suggestions and sample data', () => {
    it('suggests tags from the text, falling back to General', async () => {
      const hit = await http()
        .post('/api/v1/tag-suggestions')
        .set(as('student'))
        .send({ title: 'Spring boot', body: 'เกิด exception' })
        .expect(200);
      expect(hit.body.data).toEqual({ tags: ['Java', 'Error'] });

      const miss = await http()
        .post('/api/v1/tag-suggestions')
        .set(as('student'))
        .send({ title: 'ถามเรื่องทั่วไป' })
        .expect(200);
      expect(miss.body.data).toEqual({ tags: ['General'] });
    });

    it('loads sample data for admin only, and again without duplicating it', async () => {
      await http().post('/api/v1/sample-data').set(as('student')).expect(403);
      await http().post('/api/v1/sample-data').set(as('staff')).expect(403);

      const mine = await ask('student');
      for (let i = 0; i < 2; i += 1) {
        const res = await http().post('/api/v1/sample-data').set(as('admin')).expect(201);
        expect(res.body.data).toEqual({ questions: 5, comments: 6 });
      }

      const list = await http().get('/api/v1/questions?limit=100').set(as('student')).expect(200);
      expect(list.body.meta.total).toBe(6);
      expect(list.body.data.map((q: { id: string }) => q.id)).toContain(mine.id);
    });
  });
});
