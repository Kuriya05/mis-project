import { CloseIcon } from "@/csmju";
import { card } from "@/components/shared/classes";
import type { ExpertiseArea } from "@/data/faculty";

export interface AreaCount {
  key: ExpertiseArea;
  label: string;
  count: number;
}

// แผนภูมิแท่งแนวนอน: จำนวนอาจารย์ต่อด้าน — กดแถบเพื่อกรองรายชื่อ
export default function ExpertiseChart({
  areaCounts,
  activeArea,
  onSelectArea,
}: {
  areaCounts: AreaCount[];
  activeArea: ExpertiseArea | null;
  onSelectArea: (area: ExpertiseArea | null) => void;
}) {
  const maxCount = Math.max(1, ...areaCounts.map((a) => a.count));

  return (
    <section className={`${card} p-6 xl:col-span-2`} aria-labelledby="faculty-chart-title">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id="faculty-chart-title" className="font-display text-body-lg font-semibold text-on-surface">
            จำนวนอาจารย์ตามด้านความเชี่ยวชาญ
          </h2>
          <p className="mt-1 text-caption text-secondary">
            กดที่แถบเพื่อกรองรายชื่ออาจารย์ด้านนั้น (อาจารย์ 1 ท่านมีได้หลายด้าน)
          </p>
        </div>
        {activeArea && (
          <button
            type="button"
            onClick={() => onSelectArea(null)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full bg-surface-variant px-2.5 py-1 text-label-sm text-on-surface-variant transition-colors duration-150 hover:bg-surface-dim"
          >
            ล้างตัวกรอง <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <ul className="space-y-0.5">
        {areaCounts.map(({ key, label, count }) => {
          const selected = activeArea === key;
          const dimmed = activeArea !== null && !selected;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelectArea(selected ? null : key)}
                title={`${label}: อาจารย์ ${count} ท่าน`}
                aria-pressed={selected}
                className={`group grid w-full cursor-pointer grid-cols-[1fr_1.5rem] items-center gap-x-3 gap-y-1 rounded-lg px-2 py-2 text-left transition-colors duration-150 sm:grid-cols-[minmax(0,15rem)_1fr_1.5rem] ${
                  selected ? "bg-primary-container/10" : "hover:bg-surface"
                }`}
              >
                <span
                  className={`col-span-2 text-sm sm:col-span-1 sm:truncate ${
                    selected ? "font-semibold text-on-surface" : "text-on-surface-variant"
                  }`}
                >
                  {label}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-surface-container" aria-hidden>
                  <span
                    className={`block h-full rounded-full transition-colors duration-150 ${
                      dimmed ? "bg-primary-container/30" : "bg-primary-container group-hover:bg-primary"
                    }`}
                    // ความกว้างแท่งคำนวณตอน runtime (inline style อนุญาตเฉพาะกรณีนี้ — design-system.md)
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="text-right text-label-md text-on-surface tabular-nums">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
