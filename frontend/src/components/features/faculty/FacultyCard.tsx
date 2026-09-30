import { MailIcon, SchoolIcon } from "@/csmju";
import { btnTonal, card } from "@/components/shared/classes";
import { ExternalLinkIcon, PhoneIcon } from "@/components/shared/icons";
import {
  EXPERTISE_AREAS,
  FACULTY_SOURCE_URL,
  type ExpertiseArea,
  type FacultyMember,
} from "@/data/faculty";
import FacultyPhoto from "./FacultyPhoto";
import { displayPhone, telHref } from "./faculty-utils";

const contactIconBox =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container text-outline transition-colors duration-150";
const contactIconBoxHover = "group-hover:bg-primary-container/10 group-hover:text-primary-container";
const contactLink =
  "group flex items-center gap-3 text-sm text-on-surface transition-colors duration-150 hover:text-primary-container";

export default function FacultyCard({
  person,
  activeArea,
  onSelectArea,
}: {
  person: FacultyMember;
  activeArea: ExpertiseArea | null;
  onSelectArea: (area: ExpertiseArea | null) => void;
}) {
  const tel = telHref(person.phone);
  const phone = displayPhone(person.phone);

  return (
    <article className={`${card} fade-slide-up flex flex-col p-6 transition-shadow duration-150 hover:shadow-md`}>
      <div className="flex gap-4">
        <FacultyPhoto person={person} />
        <div className="min-w-0 flex-1">
          <div className="text-label-sm text-primary-container">{person.position}</div>
          <h3 className="mt-1 text-body-md font-semibold text-on-surface">
            {person.prefix} {person.nameTh}
          </h3>
          <div lang="en" className="text-caption text-secondary">
            {person.nameEn}
          </div>
          {person.education && (
            <div className="mt-2 flex items-start gap-1 text-caption text-secondary">
              <SchoolIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{person.education}</span>
            </div>
          )}
        </div>
      </div>

      {/* ด้านความถนัด (กดเพื่อกรอง) */}
      <div className="mt-4 flex flex-wrap gap-2">
        {person.areas.map((area) => {
          const selected = activeArea === area;
          return (
            <button
              type="button"
              key={area}
              onClick={() => onSelectArea(selected ? null : area)}
              aria-pressed={selected}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-label-sm transition-colors duration-150 ${
                selected
                  ? "bg-primary-container text-on-primary"
                  : "bg-primary-container/10 text-primary-container hover:bg-primary-container/20"
              }`}
            >
              {EXPERTISE_AREAS[area]}
            </button>
          );
        })}
      </div>

      {/* ความเชี่ยวชาญตามเว็บไซต์สาขา */}
      <ul className="mt-4 space-y-1 text-sm leading-relaxed text-on-surface-variant">
        {person.expertise.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-outline" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* ช่องทางการติดต่อ */}
      <div className="mt-auto pt-4">
        <div className="space-y-2 border-t border-outline-variant/40 pt-4">
          <a href={`mailto:${person.email}`} className={contactLink}>
            <span className={`${contactIconBox} ${contactIconBoxHover}`}>
              <MailIcon className="h-4 w-4" />
            </span>
            <span className="truncate">{person.email}</span>
          </a>
          {tel ? (
            <a href={tel} className={contactLink}>
              <span className={`${contactIconBox} ${contactIconBoxHover}`}>
                <PhoneIcon className="h-4 w-4" />
              </span>
              <span className="tabular-nums">{phone}</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 text-sm text-on-surface">
              <span className={contactIconBox}>
                <PhoneIcon className="h-4 w-4" />
              </span>
              <span className="tabular-nums">{phone}</span>
            </div>
          )}
          <a
            href={`${FACULTY_SOURCE_URL}/${person.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnTonal} mt-2 w-full`}
          >
            ดูประวัติ & ผลงานวิจัย <ExternalLinkIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}
