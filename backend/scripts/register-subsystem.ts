import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CORE_ROLE_TO_SUBSYSTEM_ROLE } from '../src/auth/role-mapping';

/**
 * Registers this subsystem in the Core Hub Subsystem Registry
 * (standards/docs/subsystem-registry.md ข้อ 1):
 *
 *   pnpm --filter backend core-hub:register            # send
 *   pnpm --filter backend core-hub:register --dry-run  # print the body only
 *
 * Reads backend/.env: CORE_HUB_URL, CORE_HUB_REGISTRATION_TOKEN (the Bearer
 * token Core Hub gave for registering), CORE_HUB_REGISTRATION_OWNER (the owner's
 * Core Hub username), SUBSYSTEM_ID, SUBSYSTEM_NAME and PUBLIC_BASE_URL/PORT for
 * the callback. A new entry starts PENDING + INACTIVE: a Core Hub admin still
 * has to approve and activate it before SSO works.
 */

// ต้องตรงกับ subsystem.yaml (repo, standards_version, callback_path)
const REPO = 'github.com/wannapa368/mis-project';
const STANDARDS_VERSION = '1.2.0';
const CALLBACK_PATH = '/auth/callback';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`❌ ยังไม่ได้ตั้ง ${name} ใน backend/.env`);
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const envFile = resolve(__dirname, '..', '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);

  const dryRun = process.argv.includes('--dry-run');
  const coreHubUrl = (process.env.CORE_HUB_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const baseUrl = (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 4235}`).replace(
    /\/+$/,
    '',
  );

  const body = {
    name: process.env.SUBSYSTEM_ID || 'csmju-study-qa',
    displayName: process.env.SUBSYSTEM_NAME || 'ถาม-ตอบวิชาการ CS แม่โจ้',
    owner: dryRun ? process.env.CORE_HUB_REGISTRATION_OWNER || '<CORE_HUB_REGISTRATION_OWNER>' : required('CORE_HUB_REGISTRATION_OWNER'),
    repo: REPO,
    standardsVersion: STANDARDS_VERSION,
    // key = core role ที่เข้าระบบนี้ได้ (subsystem-registry.md ข้อ 1)
    defaultRoleMapping: { ...CORE_ROLE_TO_SUBSYSTEM_ROLE },
    requestedExceptions: [],
    callbackUrl: `${baseUrl}${CALLBACK_PATH}`,
  };

  const url = `${coreHubUrl}/api/v1/subsystems`;
  if (dryRun) {
    console.log(`POST ${url}`);
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const token = required('CORE_HUB_REGISTRATION_TOKEN').replace(/^Bearer\s+/i, '');
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error(`❌ ติดต่อ Core Hub ที่ ${coreHubUrl} ไม่ได้ (${(err as Error).message}) — Core Hub เปิดอยู่หรือยัง?`);
    process.exit(1);
  }

  const text = await res.text();
  if (res.ok) {
    console.log(`✅ ลงทะเบียน ${body.name} แล้ว (HTTP ${res.status})`);
    console.log(text);
    console.log('ขั้นต่อไป: ให้ admin ของ Core Hub approve แล้ว activate ระบบนี้ (POST /api/v1/subsystems/:id/approve, /activate)');
    return;
  }

  if (res.status === 409) {
    console.log(`ℹ️  มีระบบชื่อ ${body.name} ในทะเบียนแล้ว ไม่ต้องลงทะเบียนซ้ำ — ให้ Core Hub ตรวจสถานะ approve/activate แทน`);
    return;
  }

  const hints: Record<number, string> = {
    400: 'ข้อมูลที่ส่งไม่ผ่านการตรวจของ Core Hub — ดูรายละเอียดด้านล่าง',
    401: 'token ไม่ถูกต้องหรือหมดอายุ — ขอ token ใหม่จาก Core Hub แล้วใส่ใน CORE_HUB_REGISTRATION_TOKEN',
    403: 'token นี้ไม่มีสิทธิ์ลงทะเบียนระบบ — ต้องเป็น token ของผู้มีสิทธิ์ใน Core Hub',
  };
  console.error(`❌ HTTP ${res.status}: ${hints[res.status] ?? 'Core Hub ตอบกลับผิดพลาด'}`);
  console.error(text);
  process.exit(1);
}

void main();
