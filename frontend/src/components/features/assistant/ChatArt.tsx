import { BotIcon } from "@/components/shared/icons";

// ภาพประกอบของบอทวิชาการ (ใช้ทั้งหน้าผู้ช่วยวิชาการและหน้าต่างแชทลอย)
// วาดด้วย token สีของแบรนด์ชุดเดียว — ห้ามไอคอนหลากสี

/** โลโก้หมวกบัณฑิตบนพื้น gradient */
export function AcademicLogo({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      className={`${size === "sm" ? "h-10 w-10" : "h-11 w-11"} bg-btn-gradient flex shrink-0 select-none items-center justify-center rounded-xl shadow-sm`}
    >
      <svg
        className="h-6 w-6 text-on-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
      </svg>
    </div>
  );
}

/** อวตารเล็กหน้าข้อความของบอท */
export function BotAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <div
      aria-hidden="true"
      className={`${size === "sm" ? "h-7 w-7" : "h-8 w-8"} bg-btn-gradient flex shrink-0 select-none items-center justify-center rounded-lg text-on-primary shadow-sm`}
    >
      <BotIcon className="h-4 w-4" />
    </div>
  );
}

/** สติกเกอร์มาสคอตบอทวิชาการ */
export function MascotAcademic() {
  return (
    <div className="fade-slide-up my-3 flex flex-col items-center">
      <svg className="h-24 w-24" viewBox="0 0 200 200" fill="none" aria-hidden="true">
        {/* หัว */}
        <rect x="50" y="40" width="100" height="70" rx="35" className="fill-primary-fixed stroke-primary-container" strokeWidth="4" />
        {/* หมวกบัณฑิต */}
        <path d="M100 15L45 35L100 55L155 35L100 15Z" className="fill-brand-navy" />
        <path d="M140 37V60" className="stroke-accent" strokeWidth="3" strokeLinecap="round" />
        <circle cx="140" cy="62" r="4" className="fill-accent" />
        {/* หน้าจอ */}
        <rect x="68" y="58" width="64" height="34" rx="17" className="fill-brand-navy" />
        {/* ตา */}
        <circle cx="88" cy="72" r="4.5" className="fill-accent" />
        <circle cx="112" cy="72" r="4.5" className="fill-accent" />
        <ellipse cx="80" cy="80" rx="4" ry="2" className="fill-on-primary-container" opacity="0.5" />
        <ellipse cx="120" cy="80" rx="4" ry="2" className="fill-on-primary-container" opacity="0.5" />
        {/* ตัว */}
        <rect x="65" y="110" width="70" height="55" rx="27.5" className="fill-primary-fixed stroke-primary-container" strokeWidth="4" />
        {/* หนังสือที่อก */}
        <rect x="88" y="122" width="24" height="20" rx="3" className="fill-primary-container" />
        <line x1="94" y1="128" x2="106" y2="128" className="stroke-on-primary" strokeWidth="2" strokeLinecap="round" />
        <line x1="94" y1="134" x2="106" y2="134" className="stroke-on-primary" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---------- ภาพประกอบการ์ดหมวดข้อมูล ----------

export function ComputerArt() {
  return (
    <svg className="h-full w-full p-4" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="20" className="fill-surface-container-lowest" />
      <rect x="22" y="24" width="56" height="38" rx="6" className="fill-primary-container stroke-brand-navy" strokeWidth="3" />
      <rect x="27" y="29" width="46" height="26" rx="3" className="fill-primary-fixed" />
      <circle cx="50" cy="42" r="6" className="fill-primary-container" />
      <path d="M42 62L36 74H64L58 62" className="fill-on-primary-container stroke-brand-navy" strokeWidth="3" strokeLinejoin="round" />
      <line x1="30" y1="74" x2="70" y2="74" className="stroke-brand-navy" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function ScholarshipArt() {
  return (
    <svg className="h-full w-full p-4" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="20" className="fill-surface-container-lowest" />
      <circle cx="50" cy="45" r="18" className="fill-accent stroke-primary-container" strokeWidth="3" />
      <path d="M43 45L48 50L57 40" className="stroke-on-primary" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="35" y="68" width="30" height="8" rx="3" className="fill-brand-navy" />
    </svg>
  );
}

export function CalendarArt() {
  return (
    <svg className="h-full w-full p-4" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="20" className="fill-surface-container-lowest" />
      <rect x="25" y="30" width="50" height="48" rx="8" className="fill-surface-container-lowest stroke-primary-container" strokeWidth="3" />
      <line x1="25" y1="44" x2="75" y2="44" className="stroke-primary-container" strokeWidth="3" />
      {[54, 64].map((cy) =>
        [40, 50, 60].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" className="fill-accent" />),
      )}
      <line x1="38" y1="22" x2="38" y2="30" className="stroke-brand-navy" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="62" y1="22" x2="62" y2="30" className="stroke-brand-navy" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function CurriculumArt() {
  return (
    <svg className="h-full w-full p-4" viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <rect width="100" height="100" rx="20" className="fill-surface-container-lowest" />
      <path
        d="M22 28C22 24.6863 24.6863 22 28 22H46C48.2091 22 50 23.7909 50 26V74C50 72.8954 48.2091 72 46 72H28C24.6863 72 22 69.3137 22 66V28Z"
        className="fill-primary-container"
      />
      <path
        d="M78 28C78 24.6863 75.3137 22 72 22H54C51.7909 22 50 23.7909 50 26V74C50 72.8954 51.7909 72 54 72H72C75.3137 72 78 69.3137 78 66V28Z"
        className="fill-accent"
      />
      {[
        [29, 36, 43],
        [29, 46, 43],
        [29, 56, 39],
        [57, 36, 71],
        [57, 46, 71],
        [57, 56, 67],
      ].map(([x1, y, x2]) => (
        <line key={`${x1}-${y}`} x1={x1} y1={y} x2={x2} y2={y} className="stroke-on-primary" strokeWidth="2.5" strokeLinecap="round" />
      ))}
    </svg>
  );
}
