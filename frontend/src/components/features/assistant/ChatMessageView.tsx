import Link from "next/link";
import { ChatBubbleIcon, ExternalLinkIcon } from "@/components/shared/icons";
import { DescriptionIcon } from "@/csmju";
import type { BotMessage, ChatMessage, PreviewImage } from "@/lib/academic-bot";
import { BotAvatar, MascotAcademic } from "./ChatArt";
import EduCarousel from "./EduCarousel";
import ImageAttachment from "./ImageAttachment";
import RichText from "./RichText";

interface Props {
  message: ChatMessage;
  /** แสดงแบบย่อสำหรับหน้าต่างแชทลอย */
  compact?: boolean;
  /** บอทกำลังตอบ — ปิดปุ่มที่ส่งข้อความใหม่ */
  busy?: boolean;
  /** ผู้ใช้ตั้งคำถามบนเว็บบอร์ดได้ */
  canAsk: boolean;
  onSend: (text: string) => void;
  onPreview: (image: PreviewImage) => void;
  /** เรียกเมื่อกดลิงก์ไปหน้าอื่นในระบบ (หน้าต่างแชทลอยใช้ย่อตัวเอง) */
  onNavigate?: () => void;
}

/** ข้อความหนึ่งรายการในแชทบอทวิชาการ */
export default function ChatMessageView({ message, compact = false, ...rest }: Props) {
  if (message.sender === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={`max-w-[80%] rounded-xl rounded-tr-sm text-on-primary shadow-sm ${
            compact ? "px-3.5 py-2 text-label-md font-normal leading-relaxed" : "px-4 py-2.5 text-body-md"
          } ${
            // หมวดหมู่ที่เลือกจากการ์ด/ปุ่มด่วน ใช้สีเข้มกว่าข้อความที่พิมพ์เอง
            message.text.startsWith("[") ? "bg-primary" : "bg-primary-container"
          }`}
        >
          {message.text}
        </div>
      </div>
    );
  }

  return <BotMessageView message={message} compact={compact} {...rest} />;
}

function BotMessageView({
  message: msg,
  compact,
  busy = false,
  canAsk,
  onSend,
  onPreview,
  onNavigate,
}: Omit<Props, "message"> & { message: BotMessage }) {
  const internalLink = `flex w-full items-center gap-2 rounded-lg px-2 text-left text-primary-container transition-colors duration-150 hover:bg-primary-container/10 ${
    compact ? "py-1.5 text-label-sm" : "py-2 text-label-md"
  }`;

  return (
    <div className={`flex items-start ${compact ? "max-w-[88%] gap-2" : "max-w-[92%] gap-3 sm:max-w-[85%]"}`}>
      {msg.isMascot ? <MascotAcademic /> : <BotAvatar size={compact ? "sm" : "md"} />}

      {msg.isEduCarousel && (
        <EduCarousel compact={compact} disabled={busy} onSend={onSend} onPreview={onPreview} />
      )}

      {msg.text && (
        <div
          className={`min-w-0 whitespace-pre-wrap rounded-xl rounded-tl-sm border border-outline-variant/40 bg-surface-container-lowest text-on-surface shadow-sm ${
            compact ? "px-3.5 py-2.5 text-label-md font-normal leading-relaxed" : "px-4 py-3 text-body-md"
          }`}
        >
          <RichText text={msg.text} />

          {msg.image && <ImageAttachment image={msg.image} onPreview={onPreview} compact={compact} />}
          {msg.images?.map((image) => (
            <ImageAttachment key={image.url} image={image} onPreview={onPreview} compact={compact} />
          ))}

          {msg.actionLink && (
            <a
              href={msg.actionLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 flex items-center justify-between gap-3 whitespace-normal rounded-lg bg-primary-container/10 text-label-md text-primary-container transition-colors duration-150 hover:bg-primary-container/20 ${
                compact ? "px-3.5 py-2.5" : "px-4 py-3"
              }`}
            >
              <span className="flex items-center gap-2">
                <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                <span>{msg.actionLink.title}</span>
              </span>
              <span className="shrink-0 rounded-full bg-surface-container-lowest px-2.5 py-1 text-label-sm">
                เปิดเว็บไซต์
              </span>
            </a>
          )}

          {msg.downloadLink && (
            <a
              href={msg.downloadLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-3 flex items-center gap-3 whitespace-normal rounded-lg border border-outline-variant bg-surface-container-lowest p-3 transition-colors duration-150 hover:border-primary-container"
            >
              <span className="shrink-0 rounded-lg bg-primary-container/10 p-2 text-primary-container">
                <DescriptionIcon className={compact ? "h-4 w-4" : "h-5 w-5"} />
              </span>
              <span className={`flex-1 text-on-surface ${compact ? "text-label-sm" : "text-label-md"}`}>
                {msg.downloadLink.title}
              </span>
              <ExternalLinkIcon className="h-4 w-4 shrink-0 text-outline group-hover:text-primary-container" />
            </a>
          )}

          {msg.searchResults && (
            <div className="mt-3 space-y-1 whitespace-normal border-t border-outline-variant/40 pt-2">
              {msg.searchResults.map((t) => (
                <Link key={t.id} href={`/questions/${t.id}`} onClick={onNavigate} className={internalLink}>
                  <ChatBubbleIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">กระทู้: {t.title}</span>
                </Link>
              ))}
              <Link
                href={msg.forumQuery ? `/questions?q=${encodeURIComponent(msg.forumQuery)}` : "/questions"}
                onClick={onNavigate}
                className={internalLink}
              >
                <ExternalLinkIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">ดูกระทู้ทั้งหมดบนเว็บบอร์ด</span>
              </Link>
            </div>
          )}

          {msg.suggestAsk && (
            <div className="mt-3 whitespace-normal border-t border-outline-variant/40 pt-2">
              {canAsk ? (
                <Link href="/questions/new" onClick={onNavigate} className={internalLink}>
                  <ChatBubbleIcon className="h-4 w-4 shrink-0" />
                  <span>ตั้งคำถามใหม่บนเว็บบอร์ด</span>
                </Link>
              ) : (
                <Link href="/questions" onClick={onNavigate} className={internalLink}>
                  <ChatBubbleIcon className="h-4 w-4 shrink-0" />
                  <span>ไปที่กระทู้ถามตอบ</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
