"use client";

import { card } from "@/components/shared/classes";
import { SparklesIcon } from "@/components/shared/icons";
import { useSession } from "@/components/shared/SessionProvider";
import { AcademicLogo } from "./ChatArt";
import ChatInput from "./ChatInput";
import ChatMessageView from "./ChatMessageView";
import ImagePreviewModal from "./ImagePreviewModal";
import QuickReplies from "./QuickReplies";
import TypingIndicator from "./TypingIndicator";
import { useAcademicChat } from "./useAcademicChat";

/** แชทบอทวิชาการแบบเต็มหน้า (หน้าแรก /) */
export default function AssistantChat() {
  const { can } = useSession();
  const chat = useAcademicChat();

  return (
    // สูงเต็มจอใต้แถบบนของ AppShell (4rem) ลบ padding ของพื้นที่เนื้อหา (p-4 / md:p-12)
    <section
      aria-labelledby="assistant-title"
      // w-0 min-w-full: แถวที่เลื่อนแนวนอน (การ์ด ปุ่มด่วน) ไม่ดันความกว้างของทั้งหน้า (หน้าจอแคบ)
      className={`${card} flex h-[calc(100dvh-6rem)] w-0 min-w-full min-h-96 flex-col md:h-[calc(100dvh-10rem)]`}
    >
      {/* หัวแชท */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant/40 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative">
            <AcademicLogo />
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-container-lowest bg-success"
            />
          </div>
          <div className="min-w-0">
            <h1
              id="assistant-title"
              className="truncate font-display text-body-lg font-semibold text-on-surface md:text-headline-md"
            >
              ข้อมูลหลักสูตร & ทุนการศึกษา
            </h1>
            <div className="flex items-center gap-2 text-caption text-secondary">
              <span lang="en">Academic AI</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold">ออนไลน์</span>
            </div>
          </div>
        </div>
        <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-label-sm text-primary sm:inline-flex">
          <SparklesIcon className="h-3.5 w-3.5" /> AI Assistant
        </span>
      </div>

      {/* ข้อความ */}
      <div
        ref={chat.listRef}
        aria-live="polite"
        className="flex-1 space-y-6 overflow-y-auto bg-background px-4 py-6 sm:px-6"
      >
        {chat.messages.map((message) => (
          <div key={message.id} className="fade-slide-up">
            <ChatMessageView
              message={message}
              busy={chat.isBotReplying}
              canAsk={can("question:create")}
              onSend={chat.send}
              onPreview={chat.openPreview}
            />
          </div>
        ))}
        {chat.isBotReplying && <TypingIndicator />}
      </div>

      {/* ปุ่มตัวเลือกด่วน + ช่องพิมพ์ */}
      <div className="shrink-0 space-y-3 border-t border-outline-variant/40 bg-surface-container-lowest px-4 py-4 sm:px-6">
        <QuickReplies disabled={chat.isBotReplying} onSend={chat.send} />
        <ChatInput
          value={chat.input}
          onChange={chat.setInput}
          onSend={chat.send}
          disabled={chat.isBotReplying}
          placeholder="ถามเรื่องหลักสูตร ค่าเทอม ทุนการศึกษา ปฏิทินการศึกษา..."
        />
      </div>

      {chat.preview && <ImagePreviewModal image={chat.preview} onClose={chat.closePreview} />}
    </section>
  );
}
