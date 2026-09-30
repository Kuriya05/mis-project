"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { justReturnedFromSignIn, onSessionExpired, signIn } from "@/lib/api";
import { can as canWith } from "@/lib/permissions";
import type { MyProfile, Permission } from "@/lib/types";
import SignInAgain from "./SignInAgain";

interface Session {
  profile: MyProfile;
  can: (permission: Permission) => boolean;
  /** เรียกหลังแก้โปรไฟล์ เพื่อให้ทุกหน้า (และ AppShell ที่ render ฝั่ง server) เห็นค่าใหม่ */
  updateProfile: (profile: MyProfile) => void;
}

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession ต้องอยู่ใต้ <SessionProvider>");
  return session;
}

/** โปรไฟล์โหลดมาแล้วจาก root layout (ฝั่ง server) — ที่นี่แค่ส่งต่อให้ component ฝั่ง client */
export default function SessionProvider({
  profile: initialProfile,
  children,
}: {
  profile: MyProfile;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [expired, setExpired] = useState(false);

  useEffect(() => setProfile(initialProfile), [initialProfile]);

  // API ตอบ 401 → re-SSO ทั้งหน้า · ถ้าเพิ่งกลับมาแล้วยัง 401 ให้ผู้ใช้กดเอง (กันวน)
  useEffect(() => {
    onSessionExpired(() => {
      if (justReturnedFromSignIn()) setExpired(true);
      else signIn();
    });
  }, []);

  const updateProfile = useCallback(
    (next: MyProfile) => {
      setProfile(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo<Session>(
    () => ({ profile, can: (permission) => canWith(profile, permission), updateProfile }),
    [profile, updateProfile],
  );

  if (expired) return <SignInAgain />;
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
