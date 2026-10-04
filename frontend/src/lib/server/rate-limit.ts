// จำกัดจำนวนคำขอต่อผู้ใช้ในหน่วยความจำของ server (หน้าต่างเวลาแบบเลื่อน)
// กันคนเดียวยิง route ของผู้ช่วย AI จนหมดโควตาของ key — รีสตาร์ต server แล้วนับใหม่

const hits = new Map<string, number[]>();

/** ok = ยังเรียกได้ (นับคำขอนี้แล้ว) · ไม่ ok = เกินโควตา ต้องรอ retryAfterSec วินาที */
export function consume(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { ok: boolean; retryAfterSec: number } {
  const recent = (hits.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true, retryAfterSec: 0 };
}
