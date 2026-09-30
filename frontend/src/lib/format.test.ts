import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatNumber, formatPhone, formatRelative, formatTime } from "./format";

// ui-design-system.md ข้อ 11.3: พ.ศ. เป็นค่าเริ่มต้น และตรึงเวลาที่ Asia/Bangkok
describe("format", () => {
  // 2026-08-11 02:30 UTC = 09:30 ที่กรุงเทพฯ
  const at = "2026-08-11T02:30:00Z";

  it("shows dates in the Buddhist calendar", () => {
    expect(formatDate(at)).toBe("11 ส.ค. 2569");
    expect(formatDate(at, "long")).toBe("11 สิงหาคม 2569");
  });

  it("shows time in Bangkok, not the machine's time zone", () => {
    expect(formatTime(at)).toBe("09:30 น.");
    expect(formatDateTime(at)).toBe("11 ส.ค. 2569 09:30 น.");
  });

  it("uses Bangkok's date near midnight UTC", () => {
    // 2026-08-11 18:00 UTC = 12 ส.ค. 01:00 ที่กรุงเทพฯ
    expect(formatDate("2026-08-11T18:00:00Z")).toBe("12 ส.ค. 2569");
  });

  it("uses relative time only up to 7 days", () => {
    const now = new Date("2026-08-11T12:00:00Z");
    expect(formatRelative("2026-08-11T11:59:30Z", now)).toBe("เมื่อสักครู่");
    expect(formatRelative("2026-08-11T11:15:00Z", now)).toBe("45 นาทีที่แล้ว");
    expect(formatRelative("2026-08-11T09:00:00Z", now)).toBe("3 ชั่วโมงที่แล้ว");
    expect(formatRelative("2026-08-04T12:00:00Z", now)).toBe("7 วันที่แล้ว");
    expect(formatRelative("2026-08-01T12:00:00Z", now)).toBe("1 ส.ค. 2569");
  });

  it("groups digits and formats phone numbers", () => {
    expect(formatNumber(2450)).toBe("2,450");
    expect(formatPhone("0812345678")).toBe("081-234-5678");
    expect(formatPhone("053873890")).toBe("053-873890");
    expect(formatPhone("053-873890-3")).toBe("053-873890-3");
  });
});
