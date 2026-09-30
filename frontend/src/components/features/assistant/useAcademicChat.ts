"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WELCOME_MESSAGES,
  getBotReplies,
  nextMessageId,
  withIds,
  type ChatMessage,
  type PreviewImage,
} from "@/lib/academic-bot";

/** หน่วงให้ดูเหมือนบอทกำลังพิมพ์ */
const REPLY_DELAY_MS = 800;

/** สถานะแชทบอทวิชาการ ใช้ร่วมกันทั้งหน้าผู้ช่วยวิชาการและหน้าต่างแชทลอย */
export function useAcademicChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(WELCOME_MESSAGES);
  const [input, setInput] = useState("");
  const [isBotReplying, setIsBotReplying] = useState(false);
  const [preview, setPreview] = useState<PreviewImage | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const replyingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  // เลื่อนรายการข้อความลงล่างสุดเมื่อมีข้อความใหม่ (เลื่อนเฉพาะกล่องแชท ไม่เลื่อนทั้งหน้า)
  useEffect(() => {
    const list = listRef.current;
    if (list && messages.length > WELCOME_MESSAGES.length) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isBotReplying]);

  const send = useCallback((text: string) => {
    if (!text.trim() || replyingRef.current) return;

    replyingRef.current = true;
    setMessages((prev) => [...prev, { id: nextMessageId(), sender: "user", text }]);
    setIsBotReplying(true);
    setInput("");

    timerRef.current = setTimeout(async () => {
      try {
        const replies = await getBotReplies(text);
        setMessages((prev) => [...prev, ...withIds(replies)]);
      } catch (err) {
        console.error(err);
      } finally {
        replyingRef.current = false;
        setIsBotReplying(false);
      }
    }, REPLY_DELAY_MS);
  }, []);

  const closePreview = useCallback(() => setPreview(null), []);

  return {
    messages,
    input,
    setInput,
    isBotReplying,
    send,
    preview,
    openPreview: setPreview,
    closePreview,
    listRef,
  };
}
