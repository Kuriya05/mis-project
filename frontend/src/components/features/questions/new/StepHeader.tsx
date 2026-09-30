import { CheckIcon } from "@/csmju";

export default function StepHeader({
  number,
  title,
  hint,
  hintId,
  done,
  htmlFor,
  required = true,
}: {
  number: number;
  title: string;
  hint?: string;
  hintId?: string;
  done: boolean;
  htmlFor: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm transition-colors duration-200 ${
          done ? "bg-success text-on-primary" : "bg-primary-container/10 text-primary-container"
        }`}
        aria-hidden="true"
      >
        {done ? <CheckIcon className="h-4 w-4" /> : number}
      </span>
      <div>
        <label htmlFor={htmlFor} className="block text-label-md text-on-surface">
          {title}
          {required && (
            <>
              {" "}
              <span className="text-error" aria-hidden="true">
                *
              </span>
            </>
          )}
        </label>
        {hint && (
          <div id={hintId} className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
