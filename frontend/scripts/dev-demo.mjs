// pnpm --filter frontend dev:demo — เปิดหน้าเว็บโหมดตัวอย่าง (ไม่ต้องมี Core Hub และ backend)
// ตั้งค่า env เองในสคริปต์ เพื่อให้ใช้ได้ทั้ง Windows และ macOS/Linux โดยไม่เพิ่ม library
import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn("next", ["dev", "--webpack", "-p", process.env.PORT || "3102"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_DEMO_MODE: "1" },
});
child.on("exit", (code) => process.exit(code ?? 0));
