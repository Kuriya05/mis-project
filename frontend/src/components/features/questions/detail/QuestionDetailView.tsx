"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { btnPrimary, btnSecondary, card, input } from "@/components/shared/classes";
import { useSession } from "@/components/shared/SessionProvider";
import { ArrowUpIcon, ChatBubbleIcon, SparklesIcon, SpinnerIcon } from "@/components/shared/icons";
import { ArrowBackIcon, CheckIcon, StatusBadge } from "@/csmju";
import { api, errorCode, errorField, errorMessage, unwrap } from "@/lib/api";
import { invalidateForumCache } from "@/lib/forum-cache";
import { formatDateTime } from "@/lib/format";
import { canOnResource, roleBadgeClass, roleLabel } from "@/lib/permissions";
import { tagClass } from "@/lib/tags";
import type { Comment, QuestionDetail, SuccessEnvelope } from "@/lib/types";
import AnswerCard, { type DeleteTarget } from "./AnswerCard";
import ContentBody from "./ContentBody";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditedLabel from "./EditedLabel";
import OwnerActions from "./OwnerActions";
import QuestionDetailSkeleton from "./QuestionDetailSkeleton";
import QuestionNotFound from "./QuestionNotFound";

type LoadState = "loading" | "ready" | "notFound" | "error";

interface VoteState {
  voteCount: number;
  hasVoted: boolean;
}

export default function QuestionDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { profile, can } = useSession();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [newCommentBody, setNewCommentBody] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // id ของคำตอบที่เจ้าของกระทู้กำลังตอบกลับ
  const [replyBody, setReplyBody] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState("");

  // แก้ไข / ลบ
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [questionDraft, setQuestionDraft] = useState({ title: "", body: "" });
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadThread = useCallback(
    async () => unwrap(await api.get<SuccessEnvelope<QuestionDetail>>(`/api/v1/questions/${id}`)),
    [id],
  );

  useEffect(() => {
    let cancelled = false;
    loadThread()
      .then((thread) => {
        if (cancelled) return;
        setQuestion(thread);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = errorCode(err);
        // id ผิดรูปแบบ (400) ก็คือลิงก์ที่ไม่มีอยู่จริงสำหรับผู้ใช้
        if (code === "NOT_FOUND" || code === "BAD_REQUEST") {
          setLoadState("notFound");
        } else {
          setLoadError(errorMessage(err, "โหลดกระทู้ไม่สำเร็จ กรุณาลองอีกครั้ง"));
          setLoadState("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadThread, reloadKey]);

  // โหลดข้อมูลใหม่หลังโหวต/ตอบ/แก้ไข
  const refreshThread = () =>
    loadThread()
      .then(setQuestion)
      .catch((err: unknown) => console.error("Failed to refresh thread", err));

  const retryLoad = () => {
    setLoadState("loading");
    setReloadKey((k) => k + 1);
  };

  if (loadState === "loading") return <QuestionDetailSkeleton />;
  if (loadState === "notFound") return <QuestionNotFound />;
  if (loadState === "error" || !question) {
    return (
      <div role="alert" className={`${card} mx-auto max-w-4xl px-6 py-12 text-center`}>
        <h1 className="mb-2 font-display text-headline-md text-on-surface">โหลดกระทู้ไม่สำเร็จ</h1>
        <p className="text-body-md text-on-surface-variant">{loadError}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/questions" className={btnSecondary}>
            กลับไปหน้ากระทู้
          </Link>
          <button type="button" onClick={retryLoad} className={btnPrimary}>
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // สิทธิ์มาจาก permission ของ Core Hub role (GET /api/v1/profiles/me) — backend ตรวจซ้ำทุกครั้ง
  const questionAuthorId = question.author.id;
  const isQuestionAuthor = questionAuthorId === profile.id;
  const canVoteQuestion = can("question:vote");
  const canVoteComment = can("comment:vote");
  const canAnswer = can("comment:create");
  const canReply = isQuestionAuthor && can("comment:create");
  const canVerify = canOnResource(profile, questionAuthorId, "comment:verify:own", "comment:verify:any");
  const canEditQuestion = canOnResource(profile, questionAuthorId, "question:update:own", "question:update:any");
  const canDeleteQuestion = canOnResource(profile, questionAuthorId, "question:delete:own", "question:delete:any");
  const canEditComment = (c: Comment) =>
    canOnResource(profile, c.author.id, "comment:update:own", "comment:update:any");
  const canDeleteComment = (c: Comment) =>
    canOnResource(profile, c.author.id, "comment:delete:own", "comment:delete:any");
  const answers = question.comments;

  // โหวตกระทู้ (กดซ้ำ = ยกเลิกโหวต)
  const handleVoteQuestion = async () => {
    setActionError("");
    try {
      const url = `/api/v1/questions/${id}/votes`;
      const response = question.hasVoted
        ? await api.delete<SuccessEnvelope<VoteState>>(url)
        : await api.post<SuccessEnvelope<VoteState>>(url);
      const { voteCount, hasVoted } = unwrap(response);
      setQuestion((q) => (q ? { ...q, voteCount, hasVoted } : q));
      invalidateForumCache();
    } catch (err) {
      setActionError(errorMessage(err, "โหวตไม่สำเร็จ กรุณาลองอีกครั้ง"));
    }
  };

  const handleVoteComment = async (comment: Comment) => {
    setActionError("");
    try {
      const url = `/api/v1/comments/${comment.id}/votes`;
      await (comment.hasVoted ? api.delete(url) : api.post(url));
      refreshThread();
    } catch (err) {
      setActionError(errorMessage(err, "โหวตไม่สำเร็จ กรุณาลองอีกครั้ง"));
    }
  };

  // ยืนยันคำตอบ (กดซ้ำ = ยกเลิกการยืนยัน)
  const handleVerifyComment = async (comment: Comment) => {
    setActionError("");
    try {
      const url = `/api/v1/comments/${comment.id}/verification`;
      await (comment.isVerified ? api.delete(url) : api.post(url));
      invalidateForumCache();
      refreshThread();
    } catch (err) {
      setActionError(errorMessage(err, "ยืนยันคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง"));
    }
  };

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCommentBody.trim() || commentSending) return;
    setActionError("");
    setCommentSending(true);
    try {
      await api.post(`/api/v1/questions/${id}/comments`, { body: newCommentBody });
      setNewCommentBody("");
      invalidateForumCache();
      refreshThread();
    } catch (err) {
      setActionError(errorMessage(err, "ส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง"));
    } finally {
      setCommentSending(false);
    }
  };

  // เจ้าของกระทู้ตอบกลับคำตอบ
  const handleSubmitReply = async (e: React.FormEvent<HTMLFormElement>, parentId: string) => {
    e.preventDefault();
    if (!replyBody.trim() || replySending) return;
    setReplySending(true);
    setReplyError("");
    try {
      await api.post(`/api/v1/questions/${id}/comments`, { body: replyBody, parentId });
      setReplyBody("");
      setReplyingTo(null);
      invalidateForumCache();
      refreshThread();
    } catch (err) {
      setReplyError(errorMessage(err, "ส่งข้อความตอบกลับไม่สำเร็จ กรุณาลองอีกครั้ง"));
    } finally {
      setReplySending(false);
    }
  };

  const toggleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyBody("");
    setReplyError("");
  };

  const startEditQuestion = () => {
    setQuestionDraft({ title: question.title, body: question.body });
    setEditingQuestion(true);
    setEditingCommentId(null);
    setEditError("");
  };

  const handleSaveQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!questionDraft.title.trim() || !questionDraft.body.trim()) {
      setEditError("กรุณากรอกหัวข้อและรายละเอียดคำถาม");
      document.getElementById(questionDraft.title.trim() ? "edit-body" : "edit-title")?.focus();
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      const updated = unwrap(
        await api.patch<SuccessEnvelope<QuestionDetail>>(`/api/v1/questions/${id}`, {
          title: questionDraft.title,
          body: questionDraft.body,
        }),
      );
      setQuestion(updated);
      setEditingQuestion(false);
      invalidateForumCache();
    } catch (err) {
      setEditError(errorMessage(err, "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง"));
      const field = errorField(err);
      if (field === "title" || field === "body") document.getElementById(`edit-${field}`)?.focus();
    } finally {
      setSaving(false);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setCommentDraft(comment.body);
    setEditingQuestion(false);
    setReplyingTo(null);
    setEditError("");
  };

  const handleSaveComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentDraft.trim()) {
      setEditError("กรุณากรอกข้อความ");
      return;
    }
    setSaving(true);
    setEditError("");
    try {
      const updated = unwrap(
        await api.patch<SuccessEnvelope<Comment>>(`/api/v1/comments/${editingCommentId}`, { body: commentDraft }),
      );
      // คำตอบเก็บ replies ของตัวเองไว้ ส่วนข้อความตอบกลับอยู่ใต้คำตอบ
      setQuestion((q) =>
        q
          ? {
              ...q,
              comments: q.comments.map((c) =>
                c.id === updated.id
                  ? { ...updated, replies: c.replies }
                  : { ...c, replies: c.replies.map((r) => (r.id === updated.id ? updated : r)) },
              ),
            }
          : q,
      );
      setEditingCommentId(null);
      invalidateForumCache();
    } catch (err) {
      setEditError(errorMessage(err, "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง"));
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (target: DeleteTarget) => {
    setDeleteError("");
    setPendingDelete(target);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (pendingDelete.kind === "question") {
        await api.delete(`/api/v1/questions/${id}`);
        invalidateForumCache();
        router.push("/questions");
        return;
      }
      await api.delete(`/api/v1/comments/${pendingDelete.id}`);
      invalidateForumCache();
      setPendingDelete(null);
      refreshThread();
    } catch (err) {
      setDeleteError(errorMessage(err, "ลบไม่สำเร็จ กรุณาลองอีกครั้ง"));
    } finally {
      setDeleting(false);
    }
  };

  const editing = {
    id: editingCommentId,
    draft: commentDraft,
    saving,
    error: editError,
    onDraftChange: setCommentDraft,
    onStart: startEditComment,
    onCancel: () => setEditingCommentId(null),
    onSave: handleSaveComment,
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Link
        href="/questions"
        className="inline-flex items-center gap-2 rounded-lg py-2 pr-3 pl-2 text-label-md text-on-surface-variant transition-colors duration-150 hover:bg-surface-variant/50 hover:text-primary-container"
      >
        <ArrowBackIcon className="h-5 w-5" /> กลับไปหน้ากระทู้
      </Link>

      {/* กระทู้ */}
      <article className={`${card} fade-slide-up flex gap-4 p-6 sm:gap-6 sm:p-8`}>
        <div className="flex shrink-0 flex-col items-center gap-2">
          {canVoteQuestion ? (
            <button
              type="button"
              onClick={handleVoteQuestion}
              aria-pressed={question.hasVoted}
              aria-label="โหวตกระทู้นี้"
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-150 ${
                question.hasVoted
                  ? "border-primary-container/30 bg-primary-container/10 text-primary-container"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:border-primary-container hover:text-primary-container"
              }`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center text-outline">
              <ArrowUpIcon className="h-5 w-5" />
            </span>
          )}
          <span
            className="font-display text-body-lg font-bold text-on-surface tabular-nums"
            aria-label={`${question.voteCount} โหวต`}
          >
            {question.voteCount}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-caption text-secondary">
            <Avatar name={question.author.displayName} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-label-md text-on-surface">{question.author.displayName}</span>
                <span className={roleBadgeClass(question.author.coreRole)}>{roleLabel(question.author.coreRole)}</span>
              </div>
              <div className="mt-1">
                <time dateTime={question.createdAt}>{formatDateTime(question.createdAt)}</time>{" "}
                <EditedLabel at={question.editedAt} />
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {!editingQuestion && (
                <OwnerActions
                  label="กระทู้"
                  onEdit={canEditQuestion ? startEditQuestion : undefined}
                  onDelete={
                    canDeleteQuestion
                      ? () =>
                          requestDelete({
                            kind: "question",
                            id: question.id,
                            title: "ลบกระทู้นี้?",
                            message: `กระทู้ "${question.title}" รวมถึงคำตอบและข้อความตอบกลับทั้งหมด (${question.commentCount} รายการ) จะถูกลบถาวร และไม่สามารถกู้คืนได้`,
                          })
                      : undefined
                  }
                />
              )}
              {question.status === "RESOLVED" ? (
                <StatusBadge tone="success" label="แก้ปัญหาแล้ว" />
              ) : (
                <StatusBadge tone="warning" label="กำลังรอคำตอบ" />
              )}
            </div>
          </div>

          {editingQuestion ? (
            <form onSubmit={handleSaveQuestion} noValidate className="fade-slide-up space-y-4">
              <h1 className="sr-only">แก้ไขกระทู้: {question.title}</h1>
              <div className="space-y-2">
                <label htmlFor="edit-title" className="block text-label-md text-on-surface">
                  หัวข้อคำถาม <span className="text-error" aria-hidden="true">*</span>
                </label>
                <input
                  id="edit-title"
                  type="text"
                  autoFocus
                  aria-required="true"
                  maxLength={150}
                  value={questionDraft.title}
                  onChange={(e) => setQuestionDraft((d) => ({ ...d, title: e.target.value }))}
                  className={`${input} font-semibold`}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-body" className="block text-label-md text-on-surface">
                  รายละเอียดปัญหาหรือโค้ด <span className="text-error" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="edit-body"
                  aria-required="true"
                  value={questionDraft.body}
                  onChange={(e) => setQuestionDraft((d) => ({ ...d, body: e.target.value }))}
                  rows={10}
                  className={`${input} resize-y p-4 font-mono`}
                />
              </div>
              {editError && (
                <p role="alert" className="text-label-sm text-error">
                  {editError}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingQuestion(false)} disabled={saving} className={btnSecondary}>
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} aria-busy={saving} className={btnPrimary}>
                  {saving ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}{" "}
                  บันทึกการแก้ไข
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="font-display text-headline-md text-on-surface md:text-headline-lg">{question.title}</h1>
              <ContentBody text={question.body} />
            </>
          )}

          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {question.tags.map((tag) => (
                <Link key={tag} href={`/questions?tag=${encodeURIComponent(tag)}`} className={tagClass(tag)}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </article>

      {/* คำตอบ */}
      <section className="space-y-4" aria-labelledby="answers-heading">
        {actionError && (
          <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-label-md text-on-error-container">
            {actionError}
          </p>
        )}
        <h2
          id="answers-heading"
          className="flex items-center gap-2 border-l-4 border-primary-container pl-3 font-display text-headline-md text-on-surface"
        >
          คำตอบทั้งหมด
          <span className="rounded-full bg-primary-container/10 px-2 py-0.5 text-label-sm text-primary-container tabular-nums">
            {answers.length}
          </span>
        </h2>

        {answers.map((answer) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            questionAuthorId={questionAuthorId}
            canVote={canVoteComment}
            canVerify={canVerify}
            canReply={canReply}
            canEdit={canEditComment}
            canDelete={canDeleteComment}
            editing={editing}
            reply={{
              open: replyingTo === answer.id,
              body: replyBody,
              sending: replySending,
              error: replyError,
              onBodyChange: setReplyBody,
              onToggle: () => toggleReply(answer.id),
              onSubmit: (e) => handleSubmitReply(e, answer.id),
            }}
            onVote={handleVoteComment}
            onVerify={handleVerifyComment}
            onRequestDelete={requestDelete}
          />
        ))}

        {answers.length === 0 && (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <ChatBubbleIcon className="h-6 w-6" />
            </div>
            <p className="text-body-md text-on-surface-variant">
              ยังไม่มีผู้มาแสดงความคิดเห็น ร่วมเป็นคนแรกที่จะช่วยตอบคำถามนี้กัน
            </p>
            {canAnswer && (
              <a href="#new-comment" className={`${btnSecondary} mt-6`}>
                เขียนคำตอบ
              </a>
            )}
          </div>
        )}
      </section>

      {/* กล่องเขียนคำตอบ (ผู้ที่ไม่มีสิทธิ์ comment:create อ่านได้อย่างเดียว) */}
      {canAnswer && (
        <section className={card}>
          <div className="border-b border-outline-variant/40 px-6 py-5">
            <h2 className="font-display text-headline-md text-on-surface">
              <label htmlFor="new-comment">เขียนคำตอบของคุณ</label>
            </h2>
          </div>
          <form onSubmit={handleSubmitComment} className="space-y-4 p-6">
            <textarea
              id="new-comment"
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              placeholder="พิมพ์คำตอบของคุณเพื่อช่วยเหลือเพื่อนๆ (หากต้องการแปะโค้ด ให้ใช้เครื่องหมาย ``` ครอบโค้ดไว้)..."
              rows={4}
              className={`${input} resize-y p-4 font-mono`}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-caption text-secondary">
                <Avatar name={profile.displayName} size="xs" />
                คุณกำลังตอบกลับในฐานะ <strong className="font-semibold text-on-surface">{profile.displayName}</strong>
              </span>
              <button
                type="submit"
                disabled={!newCommentBody.trim() || commentSending}
                aria-busy={commentSending}
                className={btnPrimary}
              >
                {commentSending ? (
                  <SpinnerIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}{" "}
                ส่งคำตอบ
              </button>
            </div>
          </form>
        </section>
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          title={pendingDelete.title}
          message={pendingDelete.message}
          busy={deleting}
          error={deleteError}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
