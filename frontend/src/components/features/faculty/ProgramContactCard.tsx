import { card } from "@/components/shared/classes";
import { BuildingIcon, ExternalLinkIcon, PhoneIcon, PrinterIcon } from "@/components/shared/icons";
import { FACULTY_SOURCE_URL, PROGRAM_CONTACT } from "@/data/faculty";
import { displayPhone, telHref } from "./faculty-utils";

export default function ProgramContactCard() {
  const tel = telHref(PROGRAM_CONTACT.phone);
  const phone = displayPhone(PROGRAM_CONTACT.phone);
  const fax = displayPhone(PROGRAM_CONTACT.fax);

  return (
    <section className={`${card} flex flex-col p-6`} aria-labelledby="faculty-contact-title">
      <div className="mb-4 w-fit rounded-lg bg-primary-container/10 p-2.5 text-primary-container">
        <BuildingIcon className="h-5 w-5" />
      </div>
      <h2 id="faculty-contact-title" className="font-display text-body-lg font-semibold text-on-surface">
        ติดต่อสำนักงานสาขา
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{PROGRAM_CONTACT.address}</p>
      <div className="mt-4 space-y-2 text-sm">
        {tel ? (
          <a
            href={tel}
            className="flex items-center gap-2 text-on-surface transition-colors duration-150 hover:text-primary-container"
          >
            <PhoneIcon className="h-4 w-4 text-outline" /> โทร. <span className="tabular-nums">{phone}</span>
          </a>
        ) : (
          <div className="flex items-center gap-2 text-on-surface">
            <PhoneIcon className="h-4 w-4 text-outline" /> โทร. <span className="tabular-nums">{phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-on-surface">
          <PrinterIcon className="h-4 w-4 text-outline" /> แฟกซ์. <span className="tabular-nums">{fax}</span>
        </div>
      </div>
      <a
        href={FACULTY_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto inline-flex items-center gap-1 pt-4 text-label-md text-primary-container hover:underline"
      >
        ดูบุคลากรทั้งหมดบนเว็บไซต์สาขา <ExternalLinkIcon className="h-4 w-4" />
      </a>
    </section>
  );
}
