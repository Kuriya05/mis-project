// แถบบอกว่ากำลังดูโหมดตัวอย่าง — แสดงเฉพาะตอน DEMO_MODE (ดู lib/demo/flag.ts)
export default function DemoBanner() {
  return (
    <div
      role="status"
      // tone warning ตาม design-system.md ข้อ 3.1 (brand-amber สงวนไว้ให้หน้า Login)
      className="mb-4 rounded-lg bg-amber-100 px-4 py-2.5 text-label-md font-normal text-amber-800"
    >
      <span className="font-semibold">โหมดตัวอย่าง</span> · ใช้ผู้ใช้สมมติ (นักศึกษา) และข้อมูลตัวอย่าง
      ไม่ได้เชื่อมต่อ Core Hub หรือฐานข้อมูลจริง รีเฟรชหน้าแล้วข้อมูลจะกลับเป็นค่าเริ่มต้น
    </div>
  );
}
