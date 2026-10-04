// ไอคอนเพิ่มเติมที่ design system (@/csmju/icons) ยังไม่มี — วาดแบบเดียวกับของกลาง
// (เส้น 1.8, viewBox 24, ใช้สี currentColor) และใช้เป็น local component ชั่วคราว
// ตาม ui-design-system.md ข้อ 17.0 จนกว่าจะย้ายเข้าส่วนกลาง (subsystem.yaml → local_components)

type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function ArrowUpIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M12 19V5" />
      <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
    </svg>
  );
}

export function AwardIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="9" r="6" />
      <path d="m8.5 14 -1.5 7 5-2.5 5 2.5-1.5-7" />
    </svg>
  );
}

export function BotIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4.5" />
      <circle cx="12" cy="3.5" r="1" />
      <path d="M9 13.5v1M15 13.5v1" />
      <path d="M2 13v3M22 13v3" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21" />
      <path d="M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21" />
      <path d="M3 21h18" />
      <path d="M8.5 7h3M8.5 11h3M8.5 15h3" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.8 2.8L16.5 9.5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5" />
      <path d="M12 16.2v.1" />
    </svg>
  );
}

export function CircleDashedIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M10.2 3.2a9 9 0 0 1 3.6 0" />
      <path d="M17.6 5a9 9 0 0 1 2.5 2.6" />
      <path d="M20.8 10.2a9 9 0 0 1 0 3.6" />
      <path d="M19 17.6a9 9 0 0 1-2.6 2.5" />
      <path d="M13.8 20.8a9 9 0 0 1-3.6 0" />
      <path d="M6.4 19a9 9 0 0 1-2.5-2.6" />
      <path d="M3.2 13.8a9 9 0 0 1 0-3.6" />
      <path d="M5 6.4a9 9 0 0 1 2.6-2.5" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.8" />
      <path d="m21 16-5-5-9 9" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12.5 9 5 9-5" />
      <path d="m3 16.5 9 5 9-5" />
    </svg>
  );
}

/** วงหมุนระหว่างรอ — ใส่ className="animate-spin" */
export function SpinnerIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M21 12a9 9 0 1 1-6.2-8.56" />
    </svg>
  );
}

export function LoginIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="m10 16 4-4-4-4" />
      <path d="M14 12H4" />
    </svg>
  );
}

export function ChatBubbleIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M20 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
    </svg>
  );
}

export function ChatBubblesIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M15 10a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z" />
      <path d="M18 8h1a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M5 4h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 6.1 6.1l1.4-2.3L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M7 9V3.5h10V9" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v6.5H7Z" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M20 11a8 8 0 0 0-14.3-4.7L4 8" />
      <path d="M4 3.5V8h4.5" />
      <path d="M4 13a8 8 0 0 0 14.3 4.7L20 16" />
      <path d="M20 20.5V16h-4.5" />
    </svg>
  );
}

export function ReplyIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m9 15-5-5 5-5" />
      <path d="M4 10h10a6 6 0 0 1 6 6v3" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M21 3 10.5 13.5" />
      <path d="m21 3-6.5 18-4-7.5L3 9.5 21 3Z" />
    </svg>
  );
}

export function SmileIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" />
      <path d="M9 9.5v.1M15 9.5v.1" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M11 3.5 12.6 8.4 17.5 10l-4.9 1.6L11 16.5l-1.6-4.9L4.5 10l4.9-1.6Z" />
      <path d="M18.5 15v4M16.5 17h4" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
    </svg>
  );
}

export function ZoomInIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...base} aria-hidden {...props}>
      <path d="M6.5 4.5h11v15.5L12 16.2 6.5 20Z" />
    </svg>
  );
}
