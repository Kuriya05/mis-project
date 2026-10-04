import Link from "next/link";
import Avatar from "@/components/shared/Avatar";
import { card } from "@/components/shared/classes";
import { ArrowUpIcon, ChatBubbleIcon } from "@/components/shared/icons";
import { StatusBadge } from "@/csmju";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { tagClass } from "@/lib/tags";
import { authorLabel } from "@/lib/permissions";
import type { QuestionSummary } from "@/lib/types";

// การ์ดกระทู้ 1 ใบ: ทั้งการ์ดกดเปิดกระทู้ได้ (ลิงก์ที่หัวข้อขยายเต็มการ์ด) ส่วนปุ่มโหวตอยู่เหนือลิงก์
export default function QuestionCard({
  question: q,
  canVote,
  onVote,
}: {
  question: QuestionSummary;
  canVote: boolean;
  onVote: (question: QuestionSummary) => void;
}) {
  const voteBox =
    "flex w-12 flex-col items-center rounded-lg border py-1.5 text-label-md tabular-nums transition-colors duration-150";

  return (
    <article
      className={`${card} group relative flex gap-4 p-4 transition-shadow duration-150 hover:shadow-md sm:p-6 fade-slide-up`}
    >
      <div className="flex shrink-0 flex-col items-center gap-2">
        {canVote ? (
          <button
            type="button"
            onClick={() => onVote(q)}
            aria-pressed={q.hasVoted}
            aria-label={`โหวตกระทู้ ${q.title}`}
            className={`${voteBox} relative z-10 cursor-pointer ${
              q.hasVoted
                ? "border-primary-container/30 bg-primary-container/10 text-primary-container"
                : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary-container hover:text-primary-container"
            }`}
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span>{formatNumber(q.voteCount)}</span>
          </button>
        ) : (
          <div
            className={`${voteBox} border-outline-variant bg-surface text-on-surface-variant`}
            aria-label={`${formatNumber(q.voteCount)} โหวต`}
          >
            <ArrowUpIcon className="h-4 w-4" />
            <span>{formatNumber(q.voteCount)}</span>
          </div>
        )}
        <div
          className="flex w-12 flex-col items-center py-1 text-label-md tabular-nums text-outline"
          aria-label={`${formatNumber(q.commentCount)} คำตอบ`}
        >
          <ChatBubbleIcon className="h-4 w-4" />
          <span>{formatNumber(q.commentCount)}</span>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2 text-caption text-secondary">
          <Avatar name={authorLabel(q.author)} size="xs" />
          <span className="truncate text-label-sm text-on-surface">{authorLabel(q.author)}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={q.createdAt} title={formatDateTime(q.createdAt)} className="shrink-0">
            {formatRelative(q.createdAt)}
          </time>
          <span className="ml-auto shrink-0">
            {q.status === "RESOLVED" ? (
              <StatusBadge tone="success" label="แก้ไขแล้ว" />
            ) : (
              <StatusBadge tone="warning" label="รอคำตอบ" />
            )}
          </span>
        </div>

        <h3 className="line-clamp-2 text-body-lg font-semibold text-on-surface transition-colors duration-150 group-hover:text-primary-container">
          <Link href={`/questions/${q.id}`} className="after:absolute after:inset-0 after:rounded-xl">
            {q.title}
          </Link>
        </h3>

        {q.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {q.tags.map((tag) => (
              <span key={tag} className={tagClass(tag)}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
