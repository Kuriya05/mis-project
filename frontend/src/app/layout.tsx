import type { Metadata } from "next";
import { Noto_Sans_Thai, Plus_Jakarta_Sans } from "next/font/google";
import ChatSupport from "@/components/features/chat/ChatSupport";
import DemoBanner from "@/components/shared/DemoBanner";
import SessionProvider from "@/components/shared/SessionProvider";
import SignedOutScreen from "@/components/shared/SignedOutScreen";
import { CsmjuAppShell, type NavItem } from "@/csmju";
import { DEMO_MODE } from "@/lib/demo/flag";
import { can, initialsOf, roleLabel } from "@/lib/permissions";
import { loadSession } from "@/lib/session";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});

// ต้องตรงกับ display_name ใน subsystem.yaml
const DISPLAY_NAME = "CSMJU Helpdesk";

const NAV: NavItem[] = [
  { label: "ผู้ช่วยวิชาการ", labelEn: "Assistant", href: "/", icon: "school" },
  { label: "กระทู้ถามตอบ", labelEn: "Forum", href: "/questions", icon: "description" },
  { label: "ทำเนียบอาจารย์", labelEn: "Faculty", href: "/faculty", icon: "group" },
  { label: "ข้อมูลของฉัน", labelEn: "Profile", href: "/profiles/me", icon: "settings" },
];

export const metadata: Metadata = {
  title: {
    template: `%s · ${DISPLAY_NAME} · CSMJU`,
    default: `${DISPLAY_NAME} · CSMJU`,
  },
  description: "กระดานถาม-ตอบและผู้ช่วยวิชาการ สาขาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้",
};

// ทุกหน้าขึ้นกับตัวตนผู้ใช้ — ห้าม cache (ui-design-system.md ข้อ 16.1.1)
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await loadSession();

  return (
    <html lang="th" className={`${jakarta.variable} ${notoSansThai.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        {session.status === "ready" ? (
          <CsmjuAppShell
            displayName={DISPLAY_NAME}
            nav={NAV}
            primaryAction={
              can(session.profile, "question:create")
                ? { label: "ตั้งคำถาม", href: "/questions/new" }
                : undefined
            }
            user={{
              initials: initialsOf(session.profile.displayName),
              roleLabel: roleLabel(session.profile.coreRole),
            }}
            // ออกจากระบบต้องเป็น POST /auth/logout — หน้า /logout ให้ยืนยันก่อน (auth-contract.md ข้อ 7)
            logoutHref="/logout"
          >
            <SessionProvider profile={session.profile}>
              {DEMO_MODE && <DemoBanner />}
              {children}
              <ChatSupport />
            </SessionProvider>
          </CsmjuAppShell>
        ) : (
          <SignedOutScreen reason={session.status} />
        )}
      </body>
    </html>
  );
}
