"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { useSession } from "@/components/shared/SessionProvider";
import { btnPrimary, btnSecondary, card, input } from "@/components/shared/classes";
import { SpinnerIcon } from "@/components/shared/icons";
import { CheckIcon, LogoutIcon, MailIcon } from "@/csmju";
import { api, errorCode, errorMessage, unwrap } from "@/lib/api";
import { invalidateForumCache } from "@/lib/forum-cache";
import { roleBadgeClass, roleLabel } from "@/lib/permissions";
import type { MyProfile, SuccessEnvelope } from "@/lib/types";

const NAME_MAX = 100;

// ข้อมูลของฉัน + เปลี่ยนชื่อที่แสดง (legacy Home.jsx เมนูผู้ใช้ / handleSaveName)
export default function MyProfilePanel() {
  const { profile, can, updateProfile } = useSession();
  const canEdit = can("profile:update:own");

  const [nameDraft, setNameDraft] = useState(profile.displayName);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);

  const trimmed = nameDraft.trim();
  const unchanged = trimmed === profile.displayName;

  // เปลี่ยนชื่อที่แสดงบนกระดาน (Core Hub ยังไม่มีชื่อจริงให้ ระบบนี้จึงเก็บเอง)
  const handleSaveName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trimmed || unchanged) return;
    setSaving(true);
    setNameError("");
    setSaved(false);
    try {
      const res = await api.patch<SuccessEnvelope<MyProfile>>("/api/v1/profiles/me", { displayName: nameDraft });
      const next = unwrap(res);
      invalidateForumCache(); // ชื่อผู้ตั้งกระทู้ในรายการต้องเป็นชื่อใหม่
      updateProfile(next);
      setNameDraft(next.displayName);
      setSaved(true);
    } catch (err) {
      setNameError(errorMessage(err, "บันทึกชื่อไม่สำเร็จ"));
      if (errorCode(err) === "VALIDATION_ERROR") nameInput.current?.focus();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${card} max-w-2xl fade-slide-up stagger-1`}>
      <div className="flex items-center gap-4 border-b border-outline-variant/40 px-6 py-5">
        <Avatar name={profile.displayName} size="lg" />
        <div className="min-w-0 space-y-1">
          <h2 className="truncate font-display text-headline-md text-on-surface">{profile.displayName}</h2>
          <span className={`inline-block ${roleBadgeClass(profile.coreRole)}`}>{roleLabel(profile.coreRole)}</span>
          {profile.email && (
            <p className="flex items-center gap-1.5 truncate text-body-md text-on-surface-variant">
              <MailIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </p>
          )}
        </div>
      </div>

      {canEdit && (
        <form onSubmit={handleSaveName} noValidate className="space-y-2 px-6 py-5">
          <label htmlFor="display-name" className="block text-label-md text-on-surface">
            ชื่อที่แสดงบนกระดาน
          </label>
          <input
            ref={nameInput}
            id="display-name"
            maxLength={NAME_MAX}
            value={nameDraft}
            onChange={(e) => {
              setNameDraft(e.target.value);
              setSaved(false);
            }}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "display-name-error display-name-hint" : "display-name-hint"}
            className={`${input} ${nameError ? "input-error" : ""}`}
          />
          <div className="flex justify-between gap-3 text-label-sm text-on-surface-variant">
            <span id="display-name-hint">ชื่อนี้จะแสดงในกระทู้และคำตอบของคุณ</span>
            <span className="shrink-0 tabular-nums">
              {nameDraft.length}/{NAME_MAX}
            </span>
          </div>
          {nameError && (
            <p id="display-name-error" role="alert" className="text-label-sm text-error">
              {nameError}
            </p>
          )}
          {saved && (
            <p role="status" className="text-label-sm text-emerald-700">
              บันทึกชื่อที่แสดงแล้ว
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setNameDraft(profile.displayName);
                setNameError("");
              }}
              disabled={saving || nameDraft === profile.displayName}
              className={btnSecondary}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !trimmed || unchanged}
              aria-busy={saving}
              className={btnPrimary}
            >
              {saving ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />} บันทึก
            </button>
          </div>
        </form>
      )}

      <div className="flex justify-end border-t border-outline-variant/40 px-6 py-4">
        <Link href="/logout" className={btnSecondary}>
          <LogoutIcon className="h-4 w-4" /> ออกจากระบบ
        </Link>
      </div>
    </div>
  );
}
