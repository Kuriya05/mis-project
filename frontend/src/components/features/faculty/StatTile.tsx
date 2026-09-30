import type { ComponentType, SVGProps } from "react";
import { card } from "@/components/shared/classes";
import { formatNumber } from "@/lib/format";

export default function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
}) {
  return (
    <div className={`${card} flex items-start justify-between gap-3 p-6`}>
      <div className="min-w-0">
        <div className="text-label-md text-on-surface-variant">{label}</div>
        <div className="mt-3 font-display text-headline-lg text-primary-container tabular-nums">
          {formatNumber(value)}
        </div>
      </div>
      <div className="shrink-0 rounded-lg bg-primary-container/10 p-2.5 text-primary-container">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
