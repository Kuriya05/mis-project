"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { btnPrimary, btnSecondary, card, iconBtn, input, inputShell } from "@/components/shared/classes";
import { useSession } from "@/components/shared/SessionProvider";
import { AlertCircleIcon, ImageIcon, SendIcon, SparklesIcon, SpinnerIcon } from "@/components/shared/icons";
import { AddIcon, CheckIcon, CloseIcon, SearchIcon } from "@/csmju";
import { api, errorCode, errorField, errorMessage, unwrap } from "@/lib/api";
import { invalidateForumCache } from "@/lib/forum-cache";
import { DEFAULT_HOT_TAGS } from "@/lib/tags";
import type { QuestionDetail, SuccessEnvelope, Tag } from "@/lib/types";
import { BoldIcon, CodeIcon, HashIcon, ItalicIcon, LinkIcon, TagIcon } from "./EditorIcons";
import QuestionPreview from "./QuestionPreview";
import StepHeader from "./StepHeader";
import { MAX_TAGS, MAX_TITLE, normalizeTag } from "./tag-input";

type Field = "title" | "body" | "tags";
type FieldErrors = Partial<Record<Field, string>>;
type ToolbarAction = "bold" | "italic" | "link" | "image" | "code";

const FIELD_MESSAGES: Record<Field, string> = {
  title: "กรุณากรอกหัวข้อคำถาม",
  body: "กรุณากรอกรายละเอียดคำถาม",
  tags: `แท็กไม่ถูกต้อง เลือกได้สูงสุด ${MAX_TAGS} แท็ก`,
};

const PROGRESS_WIDTH = ["w-0", "w-1/3", "w-2/3", "w-full"];

const TOOLBAR: { type: ToolbarAction; icon: typeof BoldIcon; title: string }[] = [
  { type: "bold", icon: BoldIcon, title: "ตัวหนา" },
  { type: "italic", icon: ItalicIcon, title: "ตัวเอียง" },
  { type: "link", icon: LinkIcon, title: "แทรกลิงก์" },
  { type: "image", icon: ImageIcon, title: "แนบรูปภาพ" },
];

function toolbarText(type: ToolbarAction, selected: string): string {
  switch (type) {
    case "bold":
      return `**${selected || "ตัวหนา"}**`;
    case "italic":
      return `*${selected || "ตัวเอียง"}*`;
    case "link":
      return `[${selected || "ลิงก์"}](https://example.com)`;
    case "image":
      return `![${selected || "คำอธิบายรูป"}](https://image-url.com)`;
    case "code":
      return `\n\`\`\`javascript\n${selected || "// วางโค้ดของคุณที่นี่"}\n\`\`\`\n`;
  }
}

/** `title`, `tags.0`, `tags[1]` -> ฟิลด์ของฟอร์ม */
function formFieldOf(field: string | undefined): Field | undefined {
  if (!field) return undefined;
  const root = field.split(/[.[]/)[0];
  return root === "title" || root === "body" || root === "tags" ? root : undefined;
}

export default function QuestionForm() {
  const router = useRouter();
  const { profile } = useSession();
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [boardTags, setBoardTags] = useState<Tag[]>([]); // GET /api/v1/tags
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsLoadError, setTagsLoadError] = useState("");
  const [tagsReloadKey, setTagsReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  // แท็กที่มีอยู่ในระบบ พร้อมจำนวนกระทู้ที่ใช้
  useEffect(() => {
    let cancelled = false;
    api
      .get<SuccessEnvelope<Tag[]>>("/api/v1/tags", { params: { limit: 100 } })
      .then((res) => {
        if (!cancelled) setBoardTags(unwrap(res));
      })
      .catch((err: unknown) => {
        if (!cancelled) setTagsLoadError(errorMessage(err, "โหลดรายการแท็กไม่สำเร็จ"));
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tagsReloadKey]);

  const reloadTags = () => {
    setTagsLoadError("");
    setTagsLoading(true);
    setTagsReloadKey((k) => k + 1);
  };

  // แท็กยอดฮิตเลือกได้เสมอ แม้ยังไม่มีกระทู้ใช้ · เรียงจากจำนวนกระทู้มากไปน้อย
  const existingTags = useMemo(() => {
    const counts = new Map<string, number>(DEFAULT_HOT_TAGS.map((t) => [t, 0]));
    for (const t of boardTags) counts.set(t.name, t.questionCount);
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [boardTags]);

  // AI แนะนำแท็กจากหัวข้อ/รายละเอียด (debounce 800ms)
  useEffect(() => {
    if (!title && !body) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const response = await api.post<SuccessEnvelope<{ tags: string[] }>>("/api/v1/tag-suggestions", {
          title,
          body,
        });
        if (!cancelled) setSuggestedTags(unwrap(response).tags.filter((t) => !tags.includes(t)));
      } catch (err) {
        console.error("Failed to fetch AI suggested tags", err);
      } finally {
        if (!cancelled) setIsSuggesting(false);
      }
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [title, body, tags]);

  // ซ่อนคำแนะนำเมื่อยังไม่ได้พิมพ์อะไร
  const visibleSuggestions = title || body ? suggestedTags : [];

  const setFieldError = (field: Field, message: string | undefined) =>
    setFieldErrors((prev) => ({ ...prev, [field]: message }));

  const hasTag = (tag: string) => tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  const handleAddTag = (raw: string) => {
    const cleanTag = normalizeTag(raw);
    if (!cleanTag || hasTag(cleanTag)) {
      setTagQuery("");
      return;
    }
    if (tags.length >= MAX_TAGS) {
      setFieldError("tags", `เลือกแท็กได้สูงสุด ${MAX_TAGS} แท็ก`);
      return;
    }
    // ตรงกับแท็กที่มีอยู่ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) ให้ใช้ชื่อเดิม กันแท็กซ้ำ เช่น react / React
    const existing = existingTags.find((t) => t.name.toLowerCase() === cleanTag.toLowerCase());
    const finalTag = existing ? existing.name : cleanTag;
    setTags([...tags, finalTag]);
    setSuggestedTags(suggestedTags.filter((t) => t !== finalTag));
    setTagQuery("");
    setFieldError("tags", undefined);
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
    setFieldError("tags", undefined);
  };

  const toggleTag = (tag: string) => (hasTag(tag) ? handleRemoveTag(tag) : handleAddTag(tag));

  const normalizedQuery = normalizeTag(tagQuery);
  const filteredExisting = existingTags.filter(
    (t) => !normalizedQuery || t.name.toLowerCase().includes(normalizedQuery.toLowerCase()),
  );
  const canCreateTag =
    Boolean(normalizedQuery) &&
    !existingTags.some((t) => t.name.toLowerCase() === normalizedQuery.toLowerCase()) &&
    !hasTag(normalizedQuery);

  const handleToolbarClick = (type: ToolbarAction) => {
    const textarea = bodyRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const replacement = toolbarText(type, body.substring(start, end));
    setBody(body.substring(0, start) + replacement + body.substring(end));
    setFieldError("body", undefined);
    // คืน focus ให้ช่องรายละเอียดหลัง state อัปเดต
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const focusField = (field: Field) => {
    const target = field === "title" ? titleRef.current : field === "body" ? bodyRef.current : tagInputRef.current;
    target?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const errors: FieldErrors = {};
    if (!title.trim()) errors.title = FIELD_MESSAGES.title;
    if (!body.trim()) errors.body = FIELD_MESSAGES.body;
    const invalid = Object.keys(errors) as Field[];
    if (invalid.length > 0) {
      setFieldErrors(errors);
      setFormError(`กรุณาตรวจสอบข้อมูลที่ไม่ถูกต้อง ${invalid.length} ช่อง`);
      focusField(invalid[0]);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFieldErrors({});
    try {
      const created = unwrap(
        await api.post<SuccessEnvelope<QuestionDetail>>("/api/v1/questions", { title, body, tags }),
      );
      invalidateForumCache();
      router.push(`/questions/${created.id}`);
    } catch (err) {
      const field = errorCode(err) === "VALIDATION_ERROR" ? formFieldOf(errorField(err)) : undefined;
      if (field) {
        setFieldErrors({ [field]: FIELD_MESSAGES[field] });
        focusField(field);
      }
      setFormError(errorMessage(err, "บันทึกคำถามไม่สำเร็จ กรุณาลองอีกครั้ง"));
      setSubmitting(false);
    }
  };

  const steps = [Boolean(title.trim()), Boolean(body.trim()), tags.length > 0];
  const completed = steps.filter(Boolean).length;
  const errorId = (field: Field) => `${field}-error`;

  const fieldError = (field: Field) =>
    fieldErrors[field] ? (
      <p id={errorId(field)} className="mt-2 flex items-center gap-1.5 text-label-sm text-error">
        <AlertCircleIcon className="h-4 w-4 shrink-0" /> {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
      <form onSubmit={handleSubmit} noValidate className={`${card} fade-slide-up space-y-8 p-6 sm:p-8 lg:col-span-2`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            ช่องที่มี <span className="text-error">*</span> จำเป็นต้องกรอก
          </p>
          <div className="sm:w-44">
            <div className="mb-2 flex justify-between text-label-sm text-on-surface-variant">
              <span>ความคืบหน้า</span>
              <span className="tabular-nums">{completed}/3</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-surface-container"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={completed}
              aria-label="ความคืบหน้าการกรอกคำถาม"
            >
              <div className={`bg-btn-gradient h-full rounded-full transition-[width] duration-500 ${PROGRESS_WIDTH[completed]}`} />
            </div>
          </div>
        </div>

        <div aria-live="assertive">
          {formError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 text-body-md text-on-error-container"
            >
              <AlertCircleIcon className="h-5 w-5 shrink-0" /> {formError}
            </div>
          )}
        </div>

        {/* 1. หัวข้อ */}
        <section>
          <StepHeader
            number={1}
            htmlFor="title-input"
            title="หัวข้อคำถามของคุณคืออะไร?"
            hint="สรุปปัญหาให้สั้นและเจาะจง คนอ่านจะเข้าใจได้ทันที"
            hintId="title-hint"
            done={steps[0]}
          />
          <div className="relative">
            <input
              ref={titleRef}
              id="title-input"
              type="text"
              value={title}
              maxLength={MAX_TITLE}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={fieldErrors.title ? `title-hint ${errorId("title")}` : "title-hint"}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) setFieldError("title", undefined);
              }}
              onBlur={() => !title.trim() && title !== "" && setFieldError("title", FIELD_MESSAGES.title)}
              placeholder="เช่น รัน MongoDB ไม่ขึ้นครับ Error connection refused"
              className={`${input} pr-16 font-medium ${fieldErrors.title ? "input-error" : ""}`}
            />
            <span
              className={`absolute top-1/2 right-3 -translate-y-1/2 text-caption tabular-nums ${
                title.length > MAX_TITLE - 20 ? "text-amber-800" : "text-outline"
              }`}
            >
              {title.length}/{MAX_TITLE}
            </span>
          </div>
          {fieldError("title")}
        </section>

        {/* 2. รายละเอียด */}
        <section>
          <StepHeader
            number={2}
            htmlFor="body-textarea"
            title="รายละเอียดปัญหาหรือโค้ด"
            hint="บอกสิ่งที่ลองทำไปแล้ว ผลที่คาดหวัง และ error ที่เจอ"
            hintId="body-hint"
            done={steps[1]}
          />
          <div className={`${inputShell} overflow-hidden ${fieldErrors.body ? "border-error" : ""}`}>
            <div className="flex items-center gap-1 border-b border-outline-variant/40 bg-surface px-2 py-1.5">
              {TOOLBAR.map(({ type, icon: Icon, title: buttonTitle }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleToolbarClick(type)}
                  className={iconBtn}
                  aria-label={buttonTitle}
                  title={buttonTitle}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
              <div className="mx-1.5 h-5 w-px bg-outline-variant" aria-hidden="true" />
              <button
                type="button"
                onClick={() => handleToolbarClick("code")}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-primary-container/10 px-3 py-1.5 text-label-md whitespace-nowrap text-primary-container transition-colors duration-150 hover:bg-primary-container/20"
              >
                <CodeIcon className="h-4 w-4" /> แทรก Code Block
              </button>
              <span className="ml-auto hidden pr-1 text-caption text-outline tabular-nums sm:block">
                {body.length} ตัวอักษร
              </span>
            </div>
            <textarea
              ref={bodyRef}
              id="body-textarea"
              value={body}
              aria-required="true"
              aria-invalid={Boolean(fieldErrors.body)}
              aria-describedby={fieldErrors.body ? `body-hint ${errorId("body")}` : "body-hint"}
              onChange={(e) => {
                setBody(e.target.value);
                if (e.target.value.trim()) setFieldError("body", undefined);
              }}
              onBlur={() => !body.trim() && body !== "" && setFieldError("body", FIELD_MESSAGES.body)}
              placeholder="อธิบายปัญหาที่คุณพบอย่างละเอียด และวางโค้ดที่เกี่ยวข้องเพื่อความรวดเร็วในการช่วยเหลือ..."
              rows={12}
              className="block w-full resize-y bg-surface-container-lowest p-4 font-mono text-body-md text-on-surface placeholder:text-outline/70"
            />
          </div>
          {fieldError("body")}
        </section>

        {/* 3. แท็ก */}
        <section>
          <StepHeader
            number={3}
            htmlFor="tag-input"
            title="แท็กป้ายกำกับ (Tags)"
            hint={`เลือกแท็กที่มีอยู่ หรือสร้างแท็กใหม่ได้สูงสุด ${MAX_TAGS} แท็ก`}
            hintId="tags-hint"
            done={steps[2]}
            required={false}
          />

          <div className="mb-4 flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface p-2">
            {tags.length === 0 && (
              <span className="px-1 text-sm text-outline">ยังไม่ได้เลือกแท็ก · กดเลือกจากด้านล่างได้เลย</span>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="fade-slide-up flex items-center gap-1 rounded-full bg-primary-container py-1 pr-1.5 pl-3 text-label-sm text-on-primary"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="cursor-pointer rounded-full p-0.5 transition-colors duration-150 hover:bg-on-primary/20"
                  aria-label={`ลบแท็ก ${tag}`}
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <span className="ml-auto pr-1 text-caption text-outline tabular-nums">
              {tags.length}/{MAX_TAGS}
            </span>
          </div>

          <div className="relative mb-3">
            <HashIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-outline" />
            <input
              ref={tagInputRef}
              id="tag-input"
              type="text"
              value={tagQuery}
              aria-invalid={Boolean(fieldErrors.tags)}
              aria-describedby={fieldErrors.tags ? `tags-hint ${errorId("tags")}` : "tags-hint"}
              onChange={(e) => setTagQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag(tagQuery);
                }
              }}
              placeholder="ค้นหาแท็กที่มีอยู่ หรือพิมพ์ชื่อแท็กใหม่แล้วกด Enter..."
              disabled={tags.length >= MAX_TAGS}
              className={`${input} pl-10 disabled:cursor-not-allowed disabled:opacity-60 ${fieldErrors.tags ? "input-error" : ""}`}
            />
          </div>
          {fieldError("tags")}

          {canCreateTag && tags.length < MAX_TAGS && (
            <button
              type="button"
              onClick={() => handleAddTag(tagQuery)}
              className="fade-slide-up mb-3 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-primary-container/30 bg-primary-container/10 px-3 py-2.5 text-sm text-primary-container transition-colors duration-150 hover:bg-primary-container/20"
            >
              <AddIcon className="h-4 w-4" />
              <span>
                สร้างแท็กใหม่ <strong className="font-semibold">#{normalizedQuery}</strong>
              </span>
              <kbd className="ml-auto rounded border border-primary-container/30 bg-surface-container-lowest px-1.5 py-0.5 text-label-sm text-primary-container">
                Enter
              </kbd>
            </button>
          )}

          {/* แท็กที่มีอยู่ในระบบ */}
          <div className="rounded-lg border border-outline-variant/40 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-label-md text-on-surface-variant">
              <TagIcon className="h-4 w-4 text-outline" />
              <span>แท็กที่มีอยู่ในระบบ</span>
              {tagsLoading && (
                <span role="status" className="inline-flex items-center">
                  <SpinnerIcon className="h-3.5 w-3.5 animate-spin text-outline" />
                  <span className="sr-only">กำลังโหลดข้อมูล...</span>
                </span>
              )}
              <span className="ml-auto text-caption text-secondary">ตัวเลข = จำนวนกระทู้ที่ใช้แท็กนี้</span>
            </div>
            {tagsLoadError && (
              <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-error">
                <AlertCircleIcon className="h-4 w-4 shrink-0" /> {tagsLoadError} · แสดงเฉพาะแท็กยอดฮิต
                <button
                  type="button"
                  onClick={reloadTags}
                  className="cursor-pointer text-label-sm text-primary-container hover:underline"
                >
                  ลองอีกครั้ง
                </button>
              </div>
            )}
            {filteredExisting.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredExisting.map(({ name, count }) => {
                  const selected = hasTag(name);
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => toggleTag(name)}
                      aria-pressed={selected}
                      disabled={!selected && tags.length >= MAX_TAGS}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full py-1 pr-2 pl-2.5 text-label-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                        selected
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-variant text-on-surface-variant hover:bg-primary-container/10 hover:text-primary-container"
                      }`}
                    >
                      {selected ? <CheckIcon className="h-3 w-3" /> : <HashIcon className="h-3 w-3" />}
                      {name}
                      <span
                        className={`rounded-full px-1.5 tabular-nums ${selected ? "bg-on-primary/20" : "bg-surface-container-lowest"}`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <SearchIcon className="h-4 w-4 text-outline" /> ไม่พบแท็กที่ตรงกับ “{tagQuery}” กด Enter
                เพื่อสร้างแท็กใหม่
              </p>
            )}
          </div>

          {/* AI แนะนำแท็ก */}
          <div className="mt-3 rounded-lg bg-primary-container/10 p-4" aria-live="polite">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-label-md text-primary">
              <SparklesIcon className="h-4 w-4" />
              <span>AI แนะนำจากเนื้อหาของคุณ</span>
              {isSuggesting && (
                <span className="flex items-center gap-1 text-caption text-primary-container">
                  <SpinnerIcon className="h-3 w-3 animate-spin" /> กำลังประมวลผลหมวดหมู่...
                </span>
              )}
            </div>
            {visibleSuggestions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleSuggestions.map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    disabled={tags.length >= MAX_TAGS}
                    aria-label={`เพิ่มแท็ก ${tag}`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-sm text-on-surface-variant transition-colors duration-150 hover:border-primary-container hover:text-primary-container disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <AddIcon className="h-3 w-3" /> {tag}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-sm text-on-surface-variant">
                {!title && !body
                  ? "พิมพ์หัวข้อหรือรายละเอียดคำถามเพื่อให้ AI แนะนำแท็กที่เหมาะสม"
                  : "ยังไม่มีแท็กแนะนำเพิ่มเติม"}
              </span>
            )}
          </div>
        </section>

        {/* ปุ่ม */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-outline-variant/40 pt-6 sm:flex-row sm:items-center">
          <span className="flex items-center gap-2 text-caption text-secondary sm:mr-auto">
            <Avatar name={profile.displayName} size="xs" />
            โพสต์ในนาม <strong className="font-semibold text-on-surface">{profile.displayName}</strong>
          </span>
          <Link href="/questions" className={btnSecondary}>
            ยกเลิก
          </Link>
          <button type="submit" disabled={submitting} aria-busy={submitting} className={btnPrimary}>
            {submitting ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />} โพสต์คำถาม
          </button>
        </div>
      </form>

      <QuestionPreview authorName={profile.displayName} title={title} tags={tags} />
    </div>
  );
}
