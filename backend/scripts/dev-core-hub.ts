/**
 * Core Hub จำลองสำหรับพัฒนาในเครื่อง — ใช้ระหว่างที่ระบบยังไม่ได้รับอนุมัติใน Core Hub จริง
 *
 *   pnpm dev:local        (รากของ repo — เปิดตัวนี้ + backend + frontend พร้อมกัน แล้วเปิด http://localhost:3235)
 *
 * ทำแค่ส่วนที่ระบบย่อยเรียกใช้ตามสัญญา (auth-contract.md · reference-data.md):
 *   GET /api/v1/.well-known/jwks.json   กุญแจสาธารณะ (คู่กุญแจสร้างใหม่ทุกครั้งที่เปิด อยู่ในหน่วยความจำเท่านั้น)
 *   GET /sso/authorize?subsystem&state   หน้าเลือกบัญชีทดสอบ → ส่งกลับ callback พร้อม access_token
 *   GET /api/v1/people/me                personCode ของบัญชีทดสอบ (guest ได้ 403)
 *   GET /logout                          หน้าออกจากระบบ
 *
 * token ผ่านการตรวจ 10 ขั้นของระบบย่อยเหมือนของจริง (RS256 · kid · iss · aud · exp · iat · azp)
 * ไม่มีรหัสผ่าน ไม่เก็บข้อมูลใด และไม่ยอมรันเมื่อ NODE_ENV=production
 * พอระบบได้รับอนุมัติแล้ว ใช้ pnpm dev ตามปกติ (backend/.env ชี้ Core Hub จริง)
 */
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { exportJWK, generateKeyPair, SignJWT, decodeJwt } from 'jose';

if (process.env.NODE_ENV === 'production') {
  console.error('dev-core-hub is for local development only');
  process.exit(1);
}

const PORT = Number(process.env.DEV_CORE_HUB_PORT ?? 3999);
const SUBSYSTEM_ID = process.env.SUBSYSTEM_ID ?? 'csmju-study-qa';
const CALLBACK_URL = process.env.DEV_CORE_HUB_CALLBACK_URL ?? 'http://localhost:3235/auth/callback';
const ISSUER = process.env.CORE_HUB_ISSUER ?? 'core-hub';
const AUDIENCE = process.env.CORE_HUB_AUDIENCE ?? 'csmju2030';
const KID = 'dev-core-hub-1';
const TOKEN_LIFETIME_SEC = 900;

/** บัญชีทดสอบ — personCode สมมติ (6599xxxxxx ไม่ใช่รหัสนักศึกษาจริง) */
const ACCOUNTS = [
  { sub: 'dev-student-1', role: 'student', label: 'นักศึกษา 1', email: 'student1@dev.local', personCode: '6599100001' },
  { sub: 'dev-student-2', role: 'student', label: 'นักศึกษา 2', email: 'student2@dev.local', personCode: '6599100002' },
  { sub: 'dev-lecturer', role: 'lecturer', label: 'อาจารย์', email: 'lecturer@dev.local', personCode: 'dev.lecturer' },
  { sub: 'dev-staff', role: 'staff', label: 'เจ้าหน้าที่', email: 'staff@dev.local', personCode: 'dev.staff' },
  { sub: 'dev-alumni', role: 'alumni', label: 'ศิษย์เก่า (อ่านอย่างเดียว)', email: 'alumni@dev.local', personCode: '6299100001' },
  { sub: 'dev-admin', role: 'admin', label: 'ผู้ดูแลระบบ', email: 'admin@dev.local', personCode: null },
] as const;

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function page(res: ServerResponse, status: number, title: string, body: string): void {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title><style>
body{font-family:system-ui,sans-serif;background:#f4f6fb;margin:0;display:grid;place-items:center;min-height:100vh;color:#1a1c22}
main{background:#fff;border-radius:16px;box-shadow:0 8px 30px #0001;padding:28px;max-width:420px;width:calc(100% - 32px)}
h1{font-size:20px;margin:0 0 4px}p{color:#555;font-size:14px;margin:0 0 18px}
a.acc{display:block;padding:12px 14px;border:1px solid #d7dbe6;border-radius:10px;margin-bottom:8px;text-decoration:none;color:#1a1c22}
a.acc:hover{border-color:#2563eb;background:#eef3ff}small{color:#666}.warn{background:#fff7e0;color:#7a5a00;padding:8px 10px;border-radius:8px;font-size:13px}
</style></head><body><main>${body}</main></body></html>`);
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function main(): Promise<void> {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: KID, alg: 'RS256', use: 'sig' };

  const issue = (account: (typeof ACCOUNTS)[number]) =>
    new SignJWT({ email: account.email, role: account.role, azp: SUBSYSTEM_ID })
      .setProtectedHeader({ alg: 'RS256', kid: KID, typ: 'JWT' })
      .setSubject(account.sub)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_LIFETIME_SEC}s`)
      .sign(privateKey);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    void (async () => {
      const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);

      if (url.pathname === '/api/v1/.well-known/jwks.json') {
        return json(res, 200, { keys: [jwk] });
      }

      if (url.pathname === '/sso/authorize') {
        const subsystem = url.searchParams.get('subsystem') ?? '';
        const state = url.searchParams.get('state') ?? '';
        if (subsystem !== SUBSYSTEM_ID) {
          return page(res, 404, 'ไม่พบระบบ', `<h1>ไม่พบระบบนี้ในทะเบียน (จำลอง)</h1><p>ระบบ: ${escape(subsystem)} · ที่รู้จัก: ${escape(SUBSYSTEM_ID)}</p>`);
        }
        const links = ACCOUNTS.map(
          (a) =>
            `<a class="acc" href="/sso/issue?sub=${encodeURIComponent(a.sub)}&state=${encodeURIComponent(state)}">${escape(a.label)}<br><small>${escape(a.role)} · ${escape(a.email)}</small></a>`,
        ).join('');
        return page(
          res,
          200,
          'เข้าสู่ระบบ (จำลอง)',
          `<h1>Core Hub จำลอง</h1><p>เลือกบัญชีทดสอบเพื่อเข้า ${escape(SUBSYSTEM_ID)}</p>${links}<p class="warn">ใช้ในเครื่องสำหรับพัฒนาเท่านั้น — ระบบจริง login ที่ csmju2030.jowave.com</p>`,
        );
      }

      if (url.pathname === '/sso/issue') {
        const account = ACCOUNTS.find((a) => a.sub === url.searchParams.get('sub'));
        const state = url.searchParams.get('state') ?? '';
        if (!account) {
          return page(res, 400, 'ไม่พบบัญชี', '<h1>ไม่พบบัญชีทดสอบ</h1>');
        }
        const target = new URL(CALLBACK_URL);
        target.searchParams.set('access_token', await issue(account));
        if (state) {
          target.searchParams.set('state', state);
        }
        res.writeHead(302, { location: target.toString(), 'cache-control': 'no-store' });
        return res.end();
      }

      if (url.pathname === '/api/v1/people/me') {
        const token = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1];
        let sub: unknown;
        try {
          sub = token ? decodeJwt(token).sub : undefined;
        } catch {
          sub = undefined;
        }
        const account = ACCOUNTS.find((a) => a.sub === sub);
        if (!account) {
          return json(res, 401, { success: false, error: { code: 'UNAUTHORIZED', message: 'token required' } });
        }
        return json(res, 200, {
          success: true,
          data: account.personCode ? { personCode: account.personCode, personType: account.role === 'student' ? 'STUDENT' : 'STAFF' } : null,
        });
      }

      if (url.pathname === '/logout') {
        return page(res, 200, 'ออกจากระบบแล้ว', '<h1>ออกจากระบบแล้ว (จำลอง)</h1><p><a href="http://localhost:3235/">กลับไปหน้าเว็บ</a></p>');
      }

      if (url.pathname === '/api/v1/health') {
        return json(res, 200, { success: true, data: { status: 'ok', service: 'dev-core-hub' } });
      }

      json(res, 404, { success: false, error: { code: 'NOT_FOUND', message: 'not found' } });
    })().catch((error: unknown) => {
      console.error('[dev-core-hub]', error);
      json(res, 500, { success: false, error: { code: 'INTERNAL_ERROR', message: 'dev core hub failed' } });
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[dev-core-hub] Core Hub จำลองพร้อมที่ http://localhost:${PORT} (ระบบ ${SUBSYSTEM_ID} · callback ${CALLBACK_URL})`);
  });
}

void main();
