import Image from "next/image";
import { btnTonal, card, scrollbarHide } from "@/components/shared/classes";
import { ZoomInIcon } from "@/components/shared/icons";
import {
  ACCIDENT_INSURANCE_IMAGE,
  MILITARY_DEFERMENT_IMAGE,
  type PreviewImage,
} from "@/lib/academic-bot";
import { CalendarArt, ComputerArt, CurriculumArt, ScholarshipArt } from "./ChatArt";

interface CardCopy {
  title: string;
  subtitle: string;
  highlight: string;
  cta: string;
}

interface EduCard {
  key: string;
  /** ข้อความที่ส่งให้บอทเมื่อกดปุ่มของการ์ด */
  prompt: string;
  art?: React.ReactNode;
  photo?: {
    image: { url: string; width: number; height: number };
    alt: string;
    previewTitle: string;
    badge: { full: string; compact: string };
    ariaCompact: string;
  };
  /** ข้อความบนหน้าผู้ช่วยวิชาการ */
  full: CardCopy;
  /** ข้อความย่อในหน้าต่างแชทลอย */
  compact: CardCopy;
}

const CARDS: EduCard[] = [
  {
    key: "curriculum",
    prompt: "[หลักสูตร วิทยาการคอมพิวเตอร์ (รหัส 70)]",
    art: <CurriculumArt />,
    full: { title: "หลักสูตรใหม่ (รหัส 70)", subtitle: "AI & Cloud Native (OBE)", highlight: "120–124 หน่วยกิต", cta: "ดูโครงสร้างหลักสูตร" },
    compact: { title: "หลักสูตร (รหัส 70)", subtitle: "AI & Cloud Native", highlight: "120–124 หน่วยกิต", cta: "โครงสร้างหลักสูตร" },
  },
  {
    key: "cs",
    prompt: "[ค่าเทอม วิทยาการคอมพิวเตอร์]",
    art: <ComputerArt />,
    full: { title: "วท.บ. วิทยาการคอมพิวเตอร์", subtitle: "คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้", highlight: "20,000 บ./ภาคเรียน", cta: "ดูข้อมูลค่าเทอม" },
    compact: { title: "วิทยาการคอมพิวเตอร์", subtitle: "คณะวิทยาศาสตร์", highlight: "20,000 บ./ภาคเรียน", cta: "ข้อมูลค่าเทอม" },
  },
  {
    key: "scholarship",
    prompt: "[ทุนปันน้ำใจพี่ให้น้อง]",
    art: <ScholarshipArt />,
    full: { title: "ทุน “ปันน้ำใจพี่ให้น้อง” #5", subtitle: "ทุนต่อเนื่อง & ไม่ต่อเนื่อง", highlight: "รวม 25 ทุนการศึกษา", cta: "ดูข้อมูลทุนทั้งหมด" },
    compact: { title: "ทุนปันน้ำใจฯ #5", subtitle: "ต่อเนื่อง & ไม่ต่อเนื่อง", highlight: "รวม 25 ทุน", cta: "ดูข้อมูลทุนทั้งหมด" },
  },
  {
    key: "calendar",
    prompt: "[ปฏิทินการศึกษา MJU]",
    art: <CalendarArt />,
    full: { title: "ปฏิทินการศึกษา MJU", subtitle: "กำหนดการลงทะเบียน & สอบ", highlight: "ไฟล์ PDF ทางการ", cta: "เปิดดูปฏิทิน" },
    compact: { title: "ปฏิทินการศึกษา", subtitle: "มหาวิทยาลัยแม่โจ้", highlight: "ไฟล์ PDF ทางการ", cta: "ดูปฏิทิน" },
  },
  {
    key: "military",
    prompt: "[การขอผ่อนผันทหาร]",
    photo: {
      image: MILITARY_DEFERMENT_IMAGE,
      alt: "ประกาศการขอผ่อนผันทหาร มหาวิทยาลัยแม่โจ้",
      previewTitle: "ประกาศ การขอผ่อนผันทหาร ประจำปีการศึกษา 2569 มหาวิทยาลัยแม่โจ้",
      badge: { full: "รูปประกาศทางการ", compact: "รูปประกาศ" },
      ariaCompact: "ดูรูปประกาศการขอผ่อนผันทหารขนาดใหญ่",
    },
    full: { title: "การขอผ่อนผันทหาร 2569", subtitle: "นศ. ชาย เกิด พ.ศ. 2549", highlight: "21 ก.ย. - 18 ธ.ค. 69", cta: "ดูรูปประกาศ & ข้อมูล" },
    compact: { title: "ผ่อนผันทหาร 69", subtitle: "เกิด พ.ศ. 2549", highlight: "21 ก.ย. - 18 ธ.ค.", cta: "ดูรูป & ข้อมูล" },
  },
  {
    key: "insurance",
    prompt: "[ประกันอุบัติเหตุ]",
    photo: {
      image: ACCIDENT_INSURANCE_IMAGE,
      alt: "ข้อมูลประกันอุบัติเหตุกลุ่ม มหาวิทยาลัยแม่โจ้",
      previewTitle: "ประกันอุบัติเหตุกลุ่ม มหาวิทยาลัยแม่โจ้ (เออร์โกประกันภัย)",
      badge: { full: "รูปตารางคุ้มครอง", compact: "รูปตารางคุ้มครอง" },
      ariaCompact: "ดูรูปตารางความคุ้มครองประกันอุบัติเหตุขนาดใหญ่",
    },
    full: { title: "ประกันอุบัติเหตุกลุ่ม MJU", subtitle: "บมจ.เออร์โกประกันภัย", highlight: "รักษาพยาบาล 22,000 บ.", cta: "ดูรูปตาราง & สิทธิคุ้มครอง" },
    compact: { title: "ประกันอุบัติเหตุ", subtitle: "บมจ.เออร์โกประกันภัย", highlight: "รักษา 22,000 บ.", cta: "ดูรูป & สิทธิคุ้มครอง" },
  },
];

const compactCta =
  "w-full cursor-pointer rounded-lg bg-primary-container/10 py-2 text-label-sm text-primary-container transition-colors duration-150 hover:bg-primary-container/20 disabled:cursor-not-allowed disabled:opacity-40";

/** การ์ดข้อมูลแนะนำที่เลื่อนดูได้ในแชท */
export default function EduCarousel({
  compact = false,
  disabled = false,
  onSend,
  onPreview,
}: {
  compact?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onPreview: (image: PreviewImage) => void;
}) {
  return (
    <div
      className={`${scrollbarHide} flex snap-x overflow-x-auto ${
        compact
          ? "w-75 max-w-full gap-3 px-1 py-2"
          : "min-w-0 flex-1 gap-4 py-1 pr-8 mask-r-from-85%"
      }`}
    >
      {CARDS.map((item) => {
        const copy = compact ? item.compact : item.full;
        const { photo } = item;
        return (
          <div
            key={item.key}
            className={`${card} group flex shrink-0 snap-start flex-col ${
              compact ? "w-40" : "w-52 transition-shadow duration-150 hover:shadow-md"
            }`}
          >
            {photo ? (
              <button
                type="button"
                onClick={() =>
                  onPreview({ ...photo.image, title: photo.previewTitle })
                }
                aria-label={compact ? photo.ariaCompact : `ดูรูปขนาดใหญ่: ${photo.previewTitle}`}
                className={`${compact ? "h-28" : "h-32"} relative cursor-pointer overflow-hidden bg-primary-container/10`}
              >
                <Image
                  src={photo.image.url}
                  alt={photo.alt}
                  fill
                  sizes={compact ? "10rem" : "13rem"}
                  className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                />
                <span
                  className={`absolute rounded-full bg-primary-container text-caption font-semibold text-on-primary ${
                    compact ? "left-1.5 top-1.5 px-2 py-0.5" : "left-2 top-2 px-3 py-0.5"
                  }`}
                >
                  {compact ? photo.badge.compact : photo.badge.full}
                </span>
                <span
                  className={`absolute flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-caption text-on-primary ${
                    compact ? "bottom-1.5 right-1.5" : "bottom-2 right-2"
                  }`}
                >
                  <ZoomInIcon className="h-3 w-3" /> แตะดูรูป
                </span>
              </button>
            ) : (
              <div className="h-32 bg-primary-container/10">{item.art}</div>
            )}

            <div className={compact ? "flex flex-1 flex-col justify-between p-3 text-center" : "flex flex-1 flex-col p-4"}>
              <div>
                <div className={compact ? "text-label-md text-on-surface" : "text-label-md leading-relaxed text-on-surface"}>
                  {copy.title}
                </div>
                <div className="mt-1 text-caption text-secondary">{copy.subtitle}</div>
                <div className={`mt-2 tabular-nums text-primary-container ${compact ? "text-label-sm" : "text-label-md"}`}>
                  {copy.highlight}
                </div>
              </div>
              <div className={compact ? "mt-3" : "mt-auto pt-4"}>
                <button
                  type="button"
                  onClick={() => onSend(item.prompt)}
                  disabled={disabled}
                  className={compact ? compactCta : `${btnTonal} w-full`}
                >
                  {copy.cta}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
