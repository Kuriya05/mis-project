import { readFileSync } from 'fs';
import { join } from 'path';
import {
  FACULTY_EXPERTISE,
  MAX_RECOMMENDED,
  areasForTags,
  facultyForTags,
  isFacultyId,
  recommendedLecturers,
} from './faculty-expertise';

// ทำเนียบอาจารย์ตัวจริงอยู่ที่ frontend — id ที่ AI แนะนำต้องเปิดการ์ดอาจารย์ในหน้าเว็บได้
const FRONTEND_FACULTY = readFileSync(
  join(__dirname, '..', '..', '..', 'frontend', 'src', 'data', 'faculty.ts'),
  'utf8',
);

describe('faculty expertise', () => {
  it('has the same lecturers as the directory the website shows', () => {
    const websiteIds = [...FRONTEND_FACULTY.matchAll(/^\s+id: "([^"]+)",$/gm)].map((m) => m[1]);
    expect(FACULTY_EXPERTISE.map((f) => f.id).sort()).toEqual([...websiteIds].sort());
  });

  it('only accepts ids from the directory', () => {
    expect(isFacultyId(FACULTY_EXPERTISE[0].id)).toBe(true);
    expect(isFacultyId('made-up')).toBe(false);
    expect(isFacultyId(null)).toBe(false);
  });
});

describe('lecturers from tags', () => {
  it('maps tags to areas word by word', () => {
    expect(areasForTags(['Database'])).toEqual(expect.arrayContaining(['database', 'data']));
    expect(areasForTags(['Machine-Learning'])).toContain('ai');
    expect(areasForTags(['Thai'])).not.toContain('ai');
    expect(areasForTags(['ฐานข้อมูล'])).toContain('database');
    expect(areasForTags(['General', 'Error'])).toEqual([]);
  });

  it('picks the lecturers whose areas match the tags best', () => {
    const lecturers = facultyForTags(['IoT']);
    expect(lecturers.length).toBeGreaterThan(0);
    for (const f of lecturers) {
      expect(f.areas).toContain('iot');
    }
    expect(facultyForTags(['General'])).toEqual([]);
  });
});

describe('recommended lecturers', () => {
  const iot = facultyForTags(['IoT']);

  it('lists every lecturer the tags point at, best match first', () => {
    expect(iot.length).toBeGreaterThan(1);
    expect(recommendedLecturers([], iot)).toEqual(iot.map((f) => f.id));
  });

  it('puts the AI picks first, without repeats or unknown ids', () => {
    const extra = FACULTY_EXPERTISE.find((f) => !f.areas.includes('iot'))!.id;
    expect(recommendedLecturers([extra, iot[1].id, 'made-up', extra], iot)).toEqual([
      extra,
      iot[1].id,
      ...iot.filter((f) => f.id !== iot[1].id).map((f) => f.id),
    ]);
  });

  it('caps the list', () => {
    const everyone = FACULTY_EXPERTISE.map((f) => f.id);
    expect(recommendedLecturers(everyone, [])).toHaveLength(MAX_RECOMMENDED);
    expect(recommendedLecturers('not-an-array', [])).toEqual([]);
  });
});
