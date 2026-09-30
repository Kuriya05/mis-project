import { initialsOf } from "@/lib/permissions";

const SIZES = {
  xs: "h-6 w-6 text-caption font-semibold",
  sm: "h-8 w-8 text-label-sm",
  md: "h-10 w-10 text-label-md",
  lg: "h-16 w-16 font-display text-headline-md",
} as const;

// อวตารอักษรย่อของชื่อ — อักษรสีขาวบนพื้น primary-container (ui-design-system.md ข้อ 14)
export default function Avatar({
  name = "",
  size = "md",
  className = "",
}: {
  name?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`${SIZES[size]} flex shrink-0 select-none items-center justify-center rounded-full border border-outline-variant/50 bg-primary-container text-on-primary ${className}`}
    >
      {Array.from(initialsOf(name))[0]}
    </span>
  );
}
