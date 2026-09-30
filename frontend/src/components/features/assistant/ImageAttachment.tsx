import Image from "next/image";
import { ExternalLinkIcon, ZoomInIcon } from "@/components/shared/icons";
import type { BotImage, PreviewImage } from "@/lib/academic-bot";

/** รูปที่แนบในข้อความของบอท — แตะเพื่อเปิดดูขนาดใหญ่ */
export default function ImageAttachment({
  image,
  onPreview,
  compact = false,
}: {
  image: BotImage;
  onPreview: (image: PreviewImage) => void;
  compact?: boolean;
}) {
  const title = image.caption || image.alt;

  return (
    <div className="mt-3 overflow-hidden whitespace-normal rounded-lg border border-outline-variant/40 bg-surface-container-lowest">
      <button
        type="button"
        onClick={() => onPreview({ url: image.url, width: image.width, height: image.height, title })}
        className="group relative block w-full cursor-pointer overflow-hidden bg-surface"
        aria-label={`ดูรูปขนาดใหญ่: ${title}`}
      >
        <Image
          src={image.url}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={compact ? "20rem" : "(min-width: 768px) 40rem, 90vw"}
          className={`${compact ? "max-h-80" : "max-h-96"} h-auto w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
        />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-caption text-on-primary">
          <ZoomInIcon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} /> คลิกดูรูปขนาดใหญ่
        </span>
      </button>
      {image.caption && (
        <div className="flex items-center justify-between gap-2 border-t border-outline-variant/40 bg-surface px-3 py-2 text-caption text-on-surface-variant">
          <span className="flex-1 text-center font-semibold">{image.caption}</span>
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-label-sm text-primary-container hover:underline"
          >
            เปิดแท็บใหม่ <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
