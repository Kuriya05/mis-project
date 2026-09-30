"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AcademicLogo } from "@/components/features/assistant/ChatArt";
import ChatInput from "@/components/features/assistant/ChatInput";
import ChatMessageView from "@/components/features/assistant/ChatMessageView";
import ImagePreviewModal from "@/components/features/assistant/ImagePreviewModal";
import QuickReplies from "@/components/features/assistant/QuickReplies";
import TypingIndicator from "@/components/features/assistant/TypingIndicator";
import { useAcademicChat } from "@/components/features/assistant/useAcademicChat";
import { iconRound } from "@/components/shared/classes";
import { ChatBubbleIcon, PhoneIcon } from "@/components/shared/icons";
import { useSession } from "@/components/shared/SessionProvider";
import { ArrowBackIcon, CloseIcon } from "@/csmju";

/** หน้าต่างแชทบอทวิชาการแบบลอย มุมขวาล่างของทุกหน้า (ยกเว้นหน้าผู้ช่วยวิชาการ /) */
export default function ChatSupport() {
  const pathname = usePathname();
  const { can } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const chat = useAcademicChat();

  // หน้าแรกเป็นแชทบอทเต็มหน้าอยู่แล้ว
  if (pathname === "/") return null;

  const close = () => setIsOpen(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-30 mb-[env(safe-area-inset-bottom)] font-body">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="เปิดแชทปรึกษาค่าเทอม & ทุนการศึกษา"
            className="btn-gradient group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-on-primary shadow-xl"
          >
            <ChatBubbleIcon className="h-6 w-6" />
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-error text-caption font-semibold text-on-primary ring-2 ring-surface-container-lowest"
            >
              1
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-16 whitespace-nowrap rounded-lg bg-on-surface px-3 py-2 text-label-sm text-on-primary opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              ปรึกษาค่าเทอม & ทุนการศึกษา มหาวิทยาลัยแม่โจ้
            </span>
          </button>
        )}

        {isOpen && (
          <div
            role="dialog"
            aria-label="แชทข้อมูลหลักสูตร & ทุน ม.แม่โจ้"
            className="fade-slide-up relative flex h-[min(36rem,calc(100dvh-3rem))] w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl sm:w-96"
          >
            {/* หัวหน้าต่าง */}
            <div className="flex shrink-0 items-center justify-between border-b border-outline-variant/40 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={close} className={`${iconRound} p-1.5`} aria-label="ย่อหน้าต่างแชท">
                  <ArrowBackIcon className="h-5 w-5" />
                </button>
                <AcademicLogo size="sm" />
                <div className="min-w-0">
                  <div className="truncate font-display text-body-md font-semibold leading-tight text-on-surface">
                    ข้อมูลหลักสูตร & ทุน ม.แม่โจ้
                  </div>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-success" />
                    <span className="truncate text-caption text-secondary">
                      บอทวิชาการ วิทยาการคอมพิวเตอร์ (AI)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => chat.send("[ช่องทางติดต่อ]")}
                  disabled={chat.isBotReplying}
                  className={`${iconRound} text-primary-container`}
                  aria-label="ช่องทางติดต่อหน่วยงาน"
                >
                  <PhoneIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={close} className={iconRound} aria-label="ปิด">
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* ข้อความ */}
            <div ref={chat.listRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto bg-background p-4">
              {chat.messages.map((message) => (
                <div key={message.id} className="fade-slide-up">
                  <ChatMessageView
                    message={message}
                    compact
                    busy={chat.isBotReplying}
                    canAsk={can("question:create")}
                    onSend={chat.send}
                    onPreview={chat.openPreview}
                    onNavigate={close}
                  />
                </div>
              ))}
              {chat.isBotReplying && <TypingIndicator compact />}
            </div>

            {/* ปุ่มตัวเลือกด่วน + ช่องพิมพ์ */}
            <div className="shrink-0 border-t border-outline-variant/40 bg-surface-container-lowest">
              <QuickReplies disabled={chat.isBotReplying} onSend={chat.send} className="px-3 pb-1 pt-2.5" />
              <div className="px-3 pb-3 pt-1.5">
                <ChatInput
                  compact
                  value={chat.input}
                  onChange={chat.setInput}
                  onSend={chat.send}
                  disabled={chat.isBotReplying}
                  placeholder="สอบถามค่าเทอม ทุน ปฏิทินการศึกษา..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {chat.preview && <ImagePreviewModal image={chat.preview} onClose={chat.closePreview} />}
    </>
  );
}
