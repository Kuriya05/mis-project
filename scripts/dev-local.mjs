// pnpm dev:local — ระบบเต็ม (ฐานข้อมูลจริง + backend + หน้าเว็บ) โดยใช้ Core Hub จำลองในเครื่อง
// ใช้ระหว่างที่ระบบยังไม่ได้รับอนุมัติใน Core Hub จริง · เปิด http://localhost:3235 แล้วเลือกบัญชีทดสอบ
// Core Hub จริงยังตั้งค่าอยู่ใน backend/.env ตามเดิม — ที่นี่แค่ทับค่าเฉพาะ process ที่เปิดจากสคริปต์นี้
// ตั้งค่าเองใน Node ไม่ใช้ cross-env เพื่อให้ใช้ได้ทั้ง Windows และ macOS/Linux โดยไม่เพิ่ม library
import { spawn } from "node:child_process";
import process from "node:process";

const HUB = `http://localhost:${process.env.DEV_CORE_HUB_PORT || 3999}`;

const hubEnv = {
  CORE_HUB_URL: HUB,
  CORE_HUB_JWKS_URL: `${HUB}/api/v1/.well-known/jwks.json`,
  CORE_HUB_WEB_URL: HUB,
};

const services = [
  { name: "core-hub", command: "pnpm --filter backend exec ts-node --transpile-only scripts/dev-core-hub.ts", env: {} },
  { name: "backend", command: "pnpm --filter backend dev", env: hubEnv },
  { name: "frontend", command: "pnpm --filter frontend dev", env: {} },
];

const children = services.map(({ name, command, env }) => {
  const child = spawn(command, { shell: true, env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
  const prefix = (line) => (line ? `[${name}] ${line}` : line);
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => process.stdout.write(chunk.split("\n").map(prefix).join("\n")));
  }
  child.on("exit", (code) => {
    console.log(`[${name}] stopped (${code ?? "signal"}) — stopping the others`);
    shutdown(code ?? 1);
  });
  return child;
});

let stopping = false;
function shutdown(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) {
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      else child.kill("SIGTERM");
    }
  }
  setTimeout(() => process.exit(code), 500);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("เปิด http://localhost:3235 (ต้องเป็น localhost) แล้วเลือกบัญชีทดสอบที่ Core Hub จำลอง · หยุดด้วย Ctrl + C");
