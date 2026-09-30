# คำสั่งสำหรับ AI ที่ทำงานในโปรเจกต์นี้

โปรเจกต์นี้คือหน้าเว็บของระบบย่อย CSMJU2030 สร้างจาก template `csmju-subsystem-web`

1. อ่าน `design-system.md` ทั้งไฟล์ก่อนเขียนโค้ดทุกครั้ง และทำตามข้อ 20.1 เป็น system prompt
2. **ช่วงนี้ยังไม่มี package `@csmju2030/design-system`** — ห้าม import หรือติดตั้ง package นี้ ให้ import จาก `@/csmju` แทน
   (`CsmjuAppShell`, `CsmjuLogo`, `PageHeader`, `Modal`, `ConfirmDeleteModal`, `Tabs`, `StatusBadge`, ไอคอนทั้งหมด และ class ใน `ui.ts`)
3. ❌ ห้ามแก้ไฟล์ในโฟลเดอร์ `csmju/` และ `app/globals.css` — ถ้าของที่มีไม่พอ ให้หยุดและแจ้งผู้ใช้ตามข้อ 17.4
4. component ใหม่ของระบบนี้ใส่ใน `components/` และต้องประกอบจากของใน `@/csmju` + token ใน `globals.css` เท่านั้น
5. จัดสไตล์ด้วย Tailwind CSS เท่านั้น ห้าม hex ดิบ (`bg-[#...]`) ห้าม CSS Modules / Sass / CSS-in-JS
6. `CsmjuAppShell` ถูกเรียกใน `app/layout.tsx` แล้ว ห้ามเรียกซ้ำหรือวาด sidebar/header เอง
7. ทุก route segment ต้องมี `loading.tsx` / `error.tsx` / `not-found.tsx` ตามตัวอย่างใน `app/`
8. Next.js เวอร์ชันนี้ใหม่กว่าที่ AI ส่วนใหญ่รู้จัก — อ่านคู่มือใน `node_modules/next/dist/docs/` ก่อนใช้ API ที่ไม่แน่ใจ (เช่น `error.tsx` ใช้ `retry()`, `middleware` เปลี่ยนชื่อเป็น `proxy`)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
