"use client";

import Avatar from "@/components/shared/Avatar";
import { btnPrimary, btnSecondary, btnTonal, input } from "@/components/shared/classes";
import { ArrowUpIcon, ReplyIcon, SendIcon, SpinnerIcon, StarIcon } from "@/components/shared/icons";
import { formatDateTime } from "@/lib/format";
import { authorLabel, authorRoleLabel, roleBadgeClass } from "@/lib/permissions";
import type { Answer, Comment } from "@/lib/types";
import AssistantAnswerExtras from "./AssistantAnswerExtras";
import ContentBody from "./ContentBody";
import EditedLabel from "./EditedLabel";
import InlineEditor from "./InlineEditor";
import OwnerActions from "./OwnerActions";
import OwnerBadge from "./OwnerBadge";

export interface DeleteTarget {
  kind: "question" | "comment";
  id: string;
  title: string;
  message: string;
}

export interface CommentEditing {
  id: string | null;
  draft: string;
  saving: boolean;
  error: string;
  onDraftChange: (value: string) => void;
  onStart: (comment: Comment) => void;
  onCancel: () => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}

export interface ReplyState {
  open: boolean;
  body: string;
  sending: boolean;
  error: string;
  onBodyChange: (value: string) => void;
  onToggle: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

// คำตอบ 1 ข้อ พร้อมข้อความตอบกลับจากเจ้าของกระทู้
export default function AnswerCard({
  answer,
  questionAuthorId,
  canVote,
  canVerify,
  canReply,
  canEdit,
  canDelete,
  editing,
  reply,
  onVote,
  onVerify,
  onRequestDelete,
}: {
  answer: Answer;
  questionAuthorId: string;
  canVote: boolean;
  canVerify: boolean;
  canReply: boolean;
  canEdit: (comment: Comment) => boolean;
  canDelete: (comment: Comment) => boolean;
  editing: CommentEditing;
  reply: ReplyState;
  onVote: (comment: Comment) => void;
  onVerify: (comment: Comment) => void;
  onRequestDelete: (target: DeleteTarget) => void;
}) {
  const replies = answer.replies;
  const isEditingAnswer = editing.id === answer.id;
  const hasManage = canEdit(answer) || canDelete(answer);
  const showActions = (canReply || canVerify || hasManage) && !isEditingAnswer;

  return (
    <div
      className={`fade-slide-up flex gap-4 rounded-xl border p-6 shadow-sm ${
        answer.isVerified ? "border-success/40 bg-success/5" : "border-outline-variant/40 bg-surface-container-lowest"
      }`}
    >
      {/* โหวตคำตอบ */}
      <div className="flex shrink-0 flex-col items-center gap-1">
        {canVote ? (
          <button
            type="button"
            onClick={() => onVote(answer)}
            aria-pressed={answer.hasVoted}
            aria-label={`โหวตคำตอบของ ${authorLabel(answer.author)}`}
            className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-150 ${
              answer.hasVoted
                ? "border-primary-container/30 bg-primary-container/10 text-primary-container"
                : "border-outline-variant bg-surface text-outline hover:border-primary-container hover:text-primary-container"
            }`}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center text-outline">
            <ArrowUpIcon className="h-4 w-4" />
          </span>
        )}
        <span className="text-label-md text-on-surface tabular-nums" aria-label={`${answer.voteCount} โหวต`}>
          {answer.voteCount}
        </span>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {answer.isVerified && (
          <div className="flex w-fit items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-label-md text-emerald-700">
            <StarIcon className="h-4 w-4 shrink-0 fill-success text-success" />
            คำตอบนี้ถูกต้องและได้รับการยืนยันจากอาจารย์หรือเจ้าของกระทู้แล้ว
          </div>
        )}

        <div className="flex items-center gap-3 text-caption text-secondary">
          <Avatar name={authorLabel(answer.author)} size="sm" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-md text-on-surface">{authorLabel(answer.author)}</span>
              <span className={roleBadgeClass(answer.author.coreRole)}>{authorRoleLabel(answer.author)}</span>
              {answer.author.id === questionAuthorId && <OwnerBadge />}
            </div>
            <div className="mt-1">
              <time dateTime={answer.createdAt}>{formatDateTime(answer.createdAt)}</time>{" "}
              <EditedLabel at={answer.editedAt} />
            </div>
          </div>
        </div>

        {isEditingAnswer ? (
          <InlineEditor
            value={editing.draft}
            onChange={editing.onDraftChange}
            onSubmit={editing.onSave}
            onCancel={editing.onCancel}
            saving={editing.saving}
            error={editing.error}
            rows={5}
          />
        ) : (
          <ContentBody text={answer.body} />
        )}

        {answer.author.isAssistant && <AssistantAnswerExtras answer={answer} />}

        {/* แก้ไข/ลบของตัวเอง · เจ้าของกระทู้ตอบกลับ · อาจารย์หรือเจ้าของกระทู้ยืนยันคำตอบ */}
        {showActions && (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {hasManage && (
              <div className="mr-auto">
                <OwnerActions
                  label="คำตอบ"
                  onEdit={canEdit(answer) ? () => editing.onStart(answer) : undefined}
                  onDelete={
                    canDelete(answer)
                      ? () =>
                          onRequestDelete({
                            kind: "comment",
                            id: answer.id,
                            title: "ลบคำตอบนี้?",
                            message:
                              replies.length > 0
                                ? `คำตอบนี้และข้อความตอบกลับ ${replies.length} รายการใต้คำตอบนี้จะถูกลบถาวร`
                                : "คำตอบนี้จะถูกลบถาวร และไม่สามารถกู้คืนได้",
                          })
                      : undefined
                  }
                />
              </div>
            )}
            {canReply && (
              <button
                type="button"
                onClick={reply.onToggle}
                aria-expanded={reply.open}
                className={reply.open ? btnTonal : btnSecondary}
              >
                <ReplyIcon className="h-4 w-4" /> ตอบกลับ
              </button>
            )}
            {canVerify && (
              <button type="button" onClick={() => onVerify(answer)} className={btnSecondary}>
                {answer.isVerified ? (
                  "ยกเลิกการยืนยันคำตอบ"
                ) : (
                  <>
                    <StarIcon className="h-4 w-4 fill-current text-primary-container" /> ยืนยันว่าคำตอบถูกต้อง
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* ข้อความตอบกลับจากเจ้าของกระทู้ */}
        {replies.length > 0 && (
          <div className="ml-1 space-y-3 border-l-2 border-surface-container pl-4">
            {replies.map((item) => (
              <div key={item.id} className="fade-slide-up">
                <div className="flex flex-wrap items-center gap-2 text-caption text-secondary">
                  <Avatar name={authorLabel(item.author)} size="xs" />
                  <span className="text-label-md text-on-surface">{authorLabel(item.author)}</span>
                  {item.author.id === questionAuthorId && <OwnerBadge />}
                  <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                  <EditedLabel at={item.editedAt} />
                  {editing.id !== item.id && (
                    <div className="ml-auto">
                      <OwnerActions
                        label="ข้อความตอบกลับ"
                        onEdit={canEdit(item) ? () => editing.onStart(item) : undefined}
                        onDelete={
                          canDelete(item)
                            ? () =>
                                onRequestDelete({
                                  kind: "comment",
                                  id: item.id,
                                  title: "ลบข้อความตอบกลับนี้?",
                                  message: "ข้อความตอบกลับนี้จะถูกลบถาวร และไม่สามารถกู้คืนได้",
                                })
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>
                {editing.id === item.id ? (
                  <div className="mt-2">
                    <InlineEditor
                      value={editing.draft}
                      onChange={editing.onDraftChange}
                      onSubmit={editing.onSave}
                      onCancel={editing.onCancel}
                      saving={editing.saving}
                      error={editing.error}
                      rows={3}
                    />
                  </div>
                ) : (
                  <div className="mt-1">
                    <ContentBody text={item.body} compact />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* กล่องพิมพ์ตอบกลับ (เฉพาะเจ้าของกระทู้) */}
        {canReply && reply.open && (
          <form onSubmit={reply.onSubmit} className="fade-slide-up ml-1 space-y-3 border-l-2 border-primary-container/30 pl-4">
            <textarea
              autoFocus
              aria-label={`ตอบกลับ ${authorLabel(answer.author)}`}
              aria-invalid={Boolean(reply.error)}
              value={reply.body}
              onChange={(e) => reply.onBodyChange(e.target.value)}
              placeholder={`ตอบกลับ ${authorLabel(answer.author)}...`}
              rows={3}
              className={`${input} resize-y p-3`}
            />
            {reply.error && (
              <p role="alert" className="text-label-sm text-error">
                {reply.error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={reply.onToggle} disabled={reply.sending} className={btnSecondary}>
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={!reply.body.trim() || reply.sending}
                aria-busy={reply.sending}
                className={btnPrimary}
              >
                {reply.sending ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}{" "}
                ส่งตอบกลับ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
