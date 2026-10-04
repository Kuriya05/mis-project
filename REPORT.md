# REPORT — csmju-study-qa

ปรับระบบ (เดิมชื่อ csmju-helpdesk) ให้ตรงมาตรฐาน csmju2030-standards **v1.7.2** และข้อมูลลงทะเบียนใน Core Hub
(ชื่อ `csmju-study-qa` · frontend `3235` · backend `4235` · callback `http://localhost:3235/auth/callback`)

## ผลรัน

```
./standards/scripts/run-all-checks.sh .
  ✅ PASS 18 ข้อ · ❌ FAIL check-no-secrets.sh (SEC-01) — พบเฉพาะ backend/.env ในเครื่อง (อยู่ใน .gitignore)
  รันซ้ำโดยไม่มี backend/.env (สภาพเดียวกับ CI):  ✅ [SEC-01/02] ไม่พบ secret หรือ .env ที่มีค่าจริง
  → บน CI คาดว่าผ่าน 19/19

pnpm --filter backend test       Tests: 221 passed, 221 total
pnpm --filter backend test:e2e   Tests: 90 passed, 90 total
pnpm --filter frontend test      Tests: 52 passed (52)
typecheck · lint (backend, frontend) · frontend build — ผ่าน
prisma migrate diff (db:drift) — No difference detected
```

conformance (`node standards/conformance/run.js`) **ยังไม่ได้รัน** — ต้องใช้ไฟล์บัญชีนอก repo (`CONFORMANCE_ACCOUNTS_FILE`) ดูหัวข้อสุดท้าย

## ไฟล์ที่สร้าง/แก้ไข

- `standards/` (submodule ใหม่ ที่ v1.7.2) · `.standards-version` = `1.7.2` — GH-04
- `subsystem.yaml` — ชื่อ `csmju-study-qa` · `base_url` เป็นพอร์ต frontend 3235 · Core Hub จริง `https://csmju2030.jowave.com` · ย้ายเวอร์ชันไป `.standards-version`
- ชื่อระบบและพอร์ต (frontend 3235 · backend 4235) — `package.json` · `frontend/package.json` · `frontend/next.config.ts` · `frontend/scripts/dev-demo.mjs` ·
  `backend/src/config/configuration.ts` · `backend/src/main.ts` · `backend/.env.example` · `docker-compose.yml` · `backend/Dockerfile` · `backend/docker/entrypoint.sh` · `backend/scripts/*` · test e2e
- `backend/src/auth/**` · `backend/src/common/{api-response,errors}.ts` · `common/filters` · `common/interceptors` — คัดลอกจาก reference (ดูหัวข้อถัดไป)
- `backend/src/core-hub/**` — คัดลอกจาก reference ทั้งโฟลเดอร์ (เรียก `/people/me` · ข้อมูลอ้างอิง)
- `backend/src/config/configuration.ts` — เพิ่ม `coreHub.data*` ที่ `core-hub/` ใช้ · `webUrl` ค่าเริ่มต้นเป็น `CORE_HUB_URL` · ลบ `sso.*` ที่ controller ใหม่ไม่ใช้ (`SSO_STATE_TTL_SEC` · `SSO_POST_LOGIN_REDIRECT`)
- `backend/src/common/guards/subsystem-throttler.guard.ts` — ส่ง Retry-After ผ่าน `AppException.retryAfterSec` เพราะ `errors.ts` ของ reference ไม่มี `tooManyRequests()`
- `backend/prisma/schema.prisma` + migration 2 ตัว
  - `20261004120000_core_roles_and_user_id_length` — enum `core_role` ครบ 6 ค่า (เพิ่ม `lecturer` `guest`) · `core_user_id` เป็น `VARCHAR(64)`
  - `20261004130000_person_code_instead_of_display_name` — ลบ `display_name` เพิ่ม `person_code` (reference-data.md ข้อ 8)
- `backend/src/profiles/**` — เก็บ `person_code` จาก `GET /people/me` แทนชื่อ · ลบ `PATCH /api/v1/profiles/me` และสิทธิ์ `profile:update:own`
- `backend/src/questions/*` · `backend/src/comments/*` — ส่ง token ของผู้ใช้ให้ `ProfilesService.ensure()` ตอนตั้งกระทู้/ตอบ
- `backend/src/sample-data/sample-data.ts` — ผู้ใช้ตัวอย่างใช้ `person_code` สมมติ (`6599xxxxxx`) แทนชื่อ
- `backend/test/helpers/{token-factory,fake-core-hub}.ts` — คัดลอกจาก reference (รองรับ `azp` · `iat` · `/people/me`)
- `backend/openapi.json` — generate ใหม่
- `frontend/src/csmju/*` · `frontend/src/app/globals.css` · `frontend/AGENTS.md` — คัดลอกจาก `standards/templates/csmju-subsystem-web` (ปุ่มออกจากระบบเป็นฟอร์ม `POST /auth/logout`) · ลบ `frontend/design-system.md`
- `frontend/next.config.ts` — proxy เฉพาะ `/api/*` และ `/auth/login` `/auth/callback` `/auth/logout` ตาม template
- `frontend/src/lib/session.ts` — ชื่อคุกกี้มาจาก `SUBSYSTEM_ID` · `frontend/.env.example` เพิ่ม `BACKEND_URL` `SUBSYSTEM_ID`
- `frontend/src/lib/permissions.ts` — `authorLabel()` (รหัสบุคคล หรือบทบาท) · ป้าย role ครบ 6 ค่า (`lecturer` = อาจารย์ · `staff` = เจ้าหน้าที่ · `guest` = ผู้เยี่ยมชม)
- `frontend/src/components/**` · `frontend/src/lib/demo/**` · `frontend/src/lib/types.ts` — แสดงผู้เขียนด้วย `authorLabel()` · หน้า "ข้อมูลของฉัน" อ่านอย่างเดียว

## ผู้ช่วย AI (Gemini)

- **ตอบกระทู้ที่ถามซ้ำ** — `backend/src/assistant/` หลังตั้งกระทู้ backend ให้ Gemini เทียบกับกระทู้เดิมที่มีคำตอบแล้ว (ล่าสุด 40 กระทู้)
  ถ้าเป็นปัญหาเดียวกัน ผู้ช่วย AI ตอบเป็น comment พร้อมลิงก์กระทู้เดิม และแนะนำอาจารย์ที่ถนัดเรื่องนั้น
  - ทำงานเบื้องหลัง ไม่ทำให้การตั้งกระทู้ช้าหรือล้ม · ปิดแอปแล้วรองานที่ค้างเสร็จก่อน (`onApplicationShutdown`)
  - profile ของผู้ช่วย AI: `core_user_id = 'system:ai-assistant'` · `is_assistant = true` (ไม่ใช่ผู้ใช้ของ Core Hub)
  - comment เก็บแค่ `recommended_faculty_id` (id ในทำเนียบ) และ `related_question_ids` — **ไม่เก็บชื่ออาจารย์** หน้าเว็บแสดงการ์ดจาก `data/faculty.ts`
  - ส่งให้ Gemini เฉพาะเนื้อหากระทู้และความถนัดของอาจารย์ ไม่ส่ง `core_user_id` · `person_code` · token (e2e ตรวจ)
  - migration `20261005090000_ai_assistant_answers`
- **แชทบอทวิชาการ** — `frontend/src/app/assistant/chat/route.ts`
  - ปุ่ม (`[...]`) ตอบด้วยข้อมูลที่เตรียมไว้ · พิมพ์เอง → Gemini ตอบจากข้อมูลของสาขา (คำตอบที่เตรียมไว้ทุกหัวข้อ + ทำเนียบอาจารย์) พร้อมประวัติแชท 8 ข้อความ
  - ต้อง login (ตรวจคุกกี้ session กับ `GET /api/v1/me`) และจำกัด 20 คำขอ/นาที/คน · AI ใช้ไม่ได้ → ใช้คำตอบที่เตรียมไว้
- key อยู่ใน `GEMINI_API_KEY` ของ `backend/.env` และ `frontend/.env.local` เท่านั้น (ไม่ commit) · เรียกด้วย fetch ไม่เพิ่ม dependency
- รุ่น `gemini-3.5-flash` → สำรอง `gemini-flash-lite-latest` (429/503/404 หรือคำตอบถูกตัดที่ `MAX_TOKENS`)
- ทดสอบกับ Gemini จริงแล้ว: กระทู้ MongoDB ที่ถามซ้ำ → ตอบ + อ้างกระทู้เดิม + แนะนำอาจารย์ด้านฐานข้อมูล · กระทู้ IoT ใหม่ → ไม่ตอบ

## อัปเดต: AI ตอบทุกกระทู้ + ข้อมูลจริงในเครื่อง

- `AssistantAnswerService` (เดิม RepeatAnswerService) ตอบ**ทุกกระทู้ใหม่**เป็นคำตอบแรกภายในไม่กี่วินาที · ถามซ้ำ → แนบกระทู้เดิม
- แนะนำอาจารย์**จากแท็ก**: `facultyForTags()` แปลงแท็กเป็นด้านความถนัด → ส่งให้ AI เลือก (`suggestedByTags`) · AI ไม่เลือก → ใช้คนที่ตรงแท็กที่สุด
- หน้ากระทู้โหลดคำตอบของ AI เองทุก 2 วินาที (นานสุด 60 วินาที) ไม่ต้องรีเฟรช
- ทดสอบ Gemini จริง (ฐานข้อมูลทดสอบ): MongoDB [Database] → ตอบ + กระทู้เดิม + อาจารย์ฐานข้อมูล · IoT → อาจารย์ IoT · Machine-Learning → อาจารย์ AI (~2.5 วินาที/กระทู้)
- **`pnpm dev:local`** (`scripts/dev-local.mjs` + `backend/scripts/dev-core-hub.ts`) — Core Hub จำลองในเครื่อง ระหว่างรออนุมัติ
  ออก token RS256 ที่ผ่านการตรวจ 10 ขั้น · บัญชีทดสอบ 6 role ไม่มีรหัสผ่าน · ไม่รันเมื่อ NODE_ENV=production · ไม่แก้ชั้น auth
  ทับ `CORE_HUB_*` เฉพาะ process ที่สคริปต์เปิด — `backend/.env` ยังชี้ Core Hub จริง
- หน้าผู้ช่วยวิชาการล้นจอแนวนอนที่จอแคบ (แถวที่เลื่อนได้ดันความกว้างหน้า) → `w-0 min-w-full`

## ฟีเจอร์เพิ่ม (รอบ 3)

- **อาจารย์ทุกคนที่ถนัด** — `comments.recommended_faculty_ids` (เดิมคนเดียว · migration ย้ายค่าเดิม) · AI ตอบให้ครอบคลุมทุกแท็ก
- **แท็บกระทู้** แก้ไขแล้ว (`status=RESOLVED`) · ยอดนิยม (`sort=popular`) · ที่บันทึกไว้ (`bookmarked=true`) · "รอคนตอบ" ไม่นับคำตอบของ AI
- **บันทึกกระทู้** `POST/DELETE /api/v1/questions/:id/bookmark` (สิทธิ์ `question:bookmark` ทุก role) · ตาราง `question_bookmarks`
- **กิจกรรมของฉัน** `GET /api/v1/profiles/me/activity` · `POST .../activity/seen` · `profiles.activity_seen_at` — แสดงในหน้าข้อมูลของฉัน + แถบในหน้ากระทู้
  (กระดิ่งใน `CsmjuAppShell` แก้ไม่ได้ตามข้อ 17.4 จึงไม่ได้ผูกกับกระดิ่ง)
- **ภาพรวม** `GET /api/v1/stats` + หน้า `/stats` (เมนู "ภาพรวม") — ยอดรวม · กระทู้/คำตอบรายสัปดาห์ (สัปดาห์ตามเวลาไทย) · แท็กยอดนิยม · ผู้ช่วยตอบดีเด่น (แสดงรหัส)
- **AI ช่วยเขียนคำถาม** `POST /assistant/draft` (ต้อง login · 10 ครั้ง/นาที) — หัวข้อที่ชัดขึ้น สิ่งที่ควรเพิ่ม แท็ก และกระทู้ที่คล้ายกัน
- **ถามอาจารย์จากทำเนียบ** — ปุ่มบนการ์ดเปิด `/questions/new?tags=...&lecturer=...` (แท็กตามความถนัด `AREA_TAGS`) · การ์ดแสดงกระทู้ที่เกี่ยวข้อง
- ลบกระทู้ตัวอย่าง 5 ข้อ (seed) ออกจาก `helpdesk_db` ตามที่ผู้ใช้ยืนยัน — กระทู้ที่ผู้ใช้ตั้งเองยังอยู่

## บั๊กที่แก้ระหว่างทาง

- เปิด dev server ผ่าน IP (`26.155.53.96:3235`) แล้วปุ่มทุกปุ่มกดไม่ได้ — Next.js บล็อกไฟล์ dev จาก host อื่น → `allowedDevOrigins` อ่านจาก `DEV_ALLOWED_ORIGINS`
- ตั้งกระทู้/ตอบในโหมดตัวอย่างผ่าน IP ไม่ได้ ("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้") — `crypto.randomUUID` ไม่มีใน http ที่ไม่ใช่ localhost → `uuidV4()` ด้วย `getRandomValues`
- ปุ่ม "ดูข้อมูลค่าเทอม" / "ดูโครงสร้างหลักสูตร" ดูเหมือนไม่ตอบ — คำตอบลงท้ายด้วยการ์ดชุดเดิม แชทเลื่อนผ่านคำตอบไป → เอาการ์ดซ้ำออก
- คำตอบ AI ถูกตัดกลางคัน — รุ่นที่ "คิด" นับโทเคนคิดรวมใน `maxOutputTokens` → ตั้ง `thinkingLevel` และเพดาน 8192
- แชทแสดงบล็อกโค้ดเป็น ``` ดิบ → `RichText` แสดง `` `code` `` และ ```` ``` ```` ได้

## ชั้น auth ที่คัดลอกมา

- คัดลอกจาก `CSMJU2030/demo-student-subsystem` (HEAD `6724d70`): `auth/auth-events.logger.ts` · `auth.errors.ts` · `auth.module.ts` · `core-hub-identity.ts` ·
  `core-hub-token.verifier.ts` (ตรวจ token 10 ขั้น) · `jwks.service.ts` · `me.controller.ts` · `next-path.ts` · `sso-session.ts` · `sso.controller.ts` ·
  `dto/sso-callback.dto.ts` · `guards/*` · `decorators/*` · `role-mapping.ts` พร้อม spec · `common/api-response.ts` · `common/errors.ts` ·
  `common/filters/all-exceptions.filter.ts` · `common/interceptors/response.interceptor.ts` · `core-hub/**`
- ลบ `auth/sso-callback.controller.ts` เดิม (แทนด้วย `sso.controller.ts`)
- แก้ไข: ไม่มี — คงไว้เฉพาะ `common/dto/pagination.dto.ts` ของเดิม ซึ่งเข้มกว่า reference (จำกัด `MAX_PAGE` · `MAX_OFFSET`)

## Role mapping ที่ประกาศ (ต้องตรงกับ default_role_mapping ในทะเบียน)

| core role | subsystem role |
|---|---|
| student | STUDENT |
| lecturer | STAFF |
| staff | STAFF |
| alumni | ALUMNI |
| guest | ALUMNI (อ่านอย่างเดียว) |
| admin | ADMIN |

## ข้อสมมติที่ตั้งเอง (เพราะมาตรฐานไม่ได้ระบุ)

1. ผู้เขียนกระทู้/คำตอบแสดงด้วย `person_code` คู่กับป้าย role · ถ้าบัญชีไม่ผูกกับบุคคล (หรือ guest) แสดงชื่อ role แทน — ผู้ใช้เลือกแนวทางนี้เอง
2. `person_code` อ่านจาก `/people/me` เฉพาะตอนที่ profile ยังไม่มีค่า (เปิดหน้าข้อมูลของฉัน · ตั้งกระทู้ · ตอบ) · Core Hub ตอบไม่ได้ (5xx/429/timeout) ไม่ทำให้คำขอล้ม
   แต่เว้นว่างไว้ (reference-data.md ข้อ 9: ข้อมูลบุคคลที่ใช้แสดงผล ให้แสดงแทนได้) · ยกเว้น 401 ที่ส่งต่อให้ frontend พา SSO ใหม่
3. หลัง login ระบบพาไป `next` หรือ `/` ตาม `sso.controller.ts` ของ reference — ตั้งปลายทางเองผ่าน env ไม่ได้แล้ว
4. backend ยังส่งหน้าเว็บต่อให้ Next ได้เมื่อตั้ง `FRONTEND_URL` (ของเดิม) แต่ประตูหลักคือ frontend `:3235` ตาม `connect-core-hub.md`

## สิ่งที่ยังทำไม่ได้ / เคสที่ยังไม่ผ่าน

- **key ของ Gemini ถูกส่งมาทางแชท** — ควรสร้าง key ใหม่แล้วเปลี่ยนใน `.env` ทั้งสองไฟล์เมื่อสะดวก
- โหมดตัวอย่างตรวจกระทู้ซ้ำที่ `frontend/src/app/assistant/answer/route.ts` (ไม่มี backend) ด้วยกติกาชุดเดียวกับ backend — แก้กติกาต้องแก้ทั้งสองที่
- `backend/src/assistant/faculty-expertise.ts` สำเนา id/ความถนัดจาก `frontend/src/data/faculty.ts` — unit test ตรวจว่า id ตรงกัน

- **`.github/workflows/ci.yml` ยังเป็นของโปรเจกต์เก่า** (MongoDB · npm · `server.js`) — ต้องแทนด้วย `standards/templates/ci.yml`
  โดยตั้ง `subsystem_name: csmju-study-qa` · ตัว agent ไม่ได้รับอนุญาตให้แก้ไฟล์ใน `.github/workflows/` จึงให้ PL ทำเอง
- **conformance L1–L3 ยังไม่ได้รัน** — ต้องมีไฟล์บัญชีนอก repo และระบบต้องอนุมัติใน Core Hub แล้ว:
  `CONFORMANCE_ACCOUNTS_FILE=~/.csmju/conformance-accounts.json node standards/conformance/run.js`
- ยังไม่ได้ทดสอบ login จริงจนจบ (ต้องใช้รหัสผ่านของเจ้าของบัญชี) — ทดสอบแล้วว่า `/auth/login` พาไป `https://csmju2030.jowave.com/sso/authorize?subsystem=csmju-study-qa`
  และ `POST /auth/logout` ตอบ 303 ไป `/logout` ของ Core Hub
- role mapping ในทะเบียน Core Hub ต้องติ๊ก `lecturer` และ `guest` ด้วยถ้าต้องการให้เข้าได้ (ตอนนี้ไม่ทราบว่าลงทะเบียนไว้ role ใดบ้าง)
