// ไอคอนของ editor ที่ทั้ง @/csmju และ components/shared/icons ยังไม่มี — วาดแบบเดียวกับของกลาง
// (เส้น 1.8, viewBox 24, currentColor) ใช้เฉพาะหน้าตั้งคำถาม จนกว่าจะย้ายเข้าส่วนกลาง

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function BoldIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
    </svg>
  );
}

export function ItalicIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M19 4h-9M14 20H5M15 4 9 20" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

export function HashIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
    </svg>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6M10 22h4" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z" />
      <path d="M7.5 7.5h.01" />
    </svg>
  );
}
