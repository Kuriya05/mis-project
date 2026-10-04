# ขึ้นระบบออนไลน์ — Vercel + Render + Neon

```text
ผู้ใช้ ─► https://<ชื่อ>.vercel.app          หน้าเว็บ (Next.js · Vercel) — ประตูเดียวของระบบ
            │  /api/* · /auth/login · /auth/callback · /auth/logout  → ส่งต่อ (BACKEND_URL)
            ▼
          https://<ชื่อ>.onrender.com          backend (NestJS · Render)
            │
            ├─► Neon PostgreSQL                 ฐานข้อมูล
            ├─► https://csmju2030.jowave.com   Core Hub (SSO · JWKS)
            └─► Gemini API                      ผู้ช่วย AI
```

ทำตามลำดับ — ทุกบัญชีสมัครด้วย GitHub ได้ · ทุกตัวมีแพ็กเกจฟรี

## 0. โค้ดต้องอยู่บน GitHub ที่บัญชีของคุณเข้าถึงได้

Vercel และ Render ดึงโค้ดจาก GitHub · ถ้าไม่มีสิทธิ์ push เข้า repo เดิม ให้ fork ไว้ที่บัญชีตัวเอง แล้ว push งานขึ้น fork

## 1. ฐานข้อมูล — Neon

1. https://neon.tech → New Project → Region: เลือกให้ตรงกับ `region` ใน `render.yaml` (ตอนนี้ Ohio = AWS US East 2) · PostgreSQL 16 ขึ้นไป
2. คัดลอก **Connection string** (แบบ pooled ไม่ได้ก็ได้) หน้าตา `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. เก็บไว้ใช้ข้อ 2 — **ห้ามใส่ใน repo หรือแชต**

ตารางถูกสร้างเองตอน backend เริ่มทำงาน (`prisma migrate deploy`)

## 2. backend — Render

1. https://render.com → New → **Blueprint** → เลือก repo → Render อ่าน `render.yaml`
2. กรอกค่าที่ Render ถาม: `DATABASE_URL` = connection string จากข้อ 1 · `GEMINI_API_KEY` = key ของ Gemini
3. รอ deploy เสร็จ แล้วเปิด `https://csmju-study-qa-api.onrender.com/api/health` → ต้องได้ `"status":"ok"`
4. จด URL ของ backend ไว้ใช้ข้อ 3

แพ็กเกจฟรีของ Render หลับเมื่อไม่มีคนใช้ 15 นาที — คำขอแรกหลังหลับรอประมาณ 1 นาที

## 3. หน้าเว็บ — Vercel

1. https://vercel.com → Add New → Project → เลือก repo
2. **Root Directory: `frontend`** · Framework: Next.js (เลือกให้เอง)
3. Environment Variables:

| ชื่อ | ค่า |
|---|---|
| `BACKEND_URL` | `https://csmju-study-qa-api.onrender.com` (URL จากข้อ 2) |
| `SUBSYSTEM_ID` | `csmju-study-qa` |
| `GEMINI_API_KEY` | key ของ Gemini |
| `GEMINI_MODELS` | `gemini-3.5-flash,gemini-flash-lite-latest` |

4. Deploy → ได้ URL เช่น `https://csmju-study-qa.vercel.app`

ห้ามตั้ง `NEXT_PUBLIC_DEMO_MODE` (โหมดตัวอย่าง) บน Vercel

## 4. ลงทะเบียน / แก้ทะเบียนใน Core Hub

| ช่อง | ค่า |
|---|---|
| ชื่อระบบ | `csmju-study-qa` |
| ชื่อที่แสดง | `ถาม-ตอบวิชาการ CS แม่โจ้` |
| Callback URL | `https://<ชื่อ>.vercel.app/auth/callback` (URL จากข้อ 3) |
| Base URL | `https://<ชื่อ>.vercel.app` |

- ยังไม่ส่งฟอร์ม: กรอกค่าตามตารางได้เลย
- ส่งไปแล้วด้วย `http://localhost:3235/...`: ก่อนอนุมัติเจ้าของแก้เองได้ · หลังอนุมัติต้องขอ admin ระบบกลางเปลี่ยนให้ (`subsystem-registry.md`)
- แก้ `base_url` ใน `subsystem.yaml` ให้เป็น URL ของ Vercel ด้วย

## 5. ทดสอบ (connect-core-hub.md ข้อ 6)

1. เปิด `https://<ชื่อ>.vercel.app` → กดเข้าสู่ระบบ → login ที่ Core Hub → กลับมาหน้าเดิม
2. ตั้งกระทู้ → ผู้ช่วย AI ตอบภายในไม่กี่วินาที → รีเฟรชแล้วกระทู้ยังอยู่
3. ออกจากระบบ → ไปหน้า logout ของ Core Hub

## ย้ายข้อมูลจากเครื่อง (ถ้าต้องการ)

```bash
"C:/Program Files/PostgreSQL/18/bin/pg_dump.exe" --data-only --no-owner --exclude-table=_prisma_migrations "postgresql://helpdesk:helpdesk@localhost:5432/helpdesk_db" > data.sql
```

```bash
"C:/Program Files/PostgreSQL/18/bin/psql.exe" "<connection string ของ Neon>" -f data.sql
```

ทำหลัง backend บน Render สร้างตารางเสร็จ (ข้อ 2) · ลบ `data.sql` ทิ้งหลังใช้ (มีข้อมูลผู้ใช้)
