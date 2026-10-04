/**
 * ความถนัดของอาจารย์ในสาขา ให้ผู้ช่วย AI เลือกแนะนำอาจารย์ที่ตรงกับคำถาม
 *
 * - คัดลอกเฉพาะ id · expertise · areas จาก frontend/src/data/faculty.ts (ทำเนียบสาธารณะของสาขา)
 *   ไม่มีชื่อหรือช่องทางติดต่อ: comment เก็บแค่ id แล้วหน้าเว็บแสดงการ์ดอาจารย์จาก id นั้นเอง
 * - แก้ทำเนียบที่ frontend แล้วต้องแก้ไฟล์นี้ตาม · faculty-expertise.spec.ts ตรวจว่า id ตรงกัน
 */
export interface FacultyExpertise {
  id: string;
  expertise: readonly string[];
  areas: readonly string[];
}

export const FACULTY_EXPERTISE: readonly FacultyExpertise[] = [
  {
    id: '9ce1c1e5-69c2-4037-8713-94ce20844d18',
    expertise: ['Decision Support System', 'Management Information System'],
    areas: ['infosys'],
  },
  {
    id: '0c86953b-1035-43b8-b4a4-8c92b261ee77',
    expertise: ['Management Information Technology', 'Internet of Things', 'Technology Administration'],
    areas: ['infosys', 'iot'],
  },
  {
    id: 'c872eaf2-30b5-4e05-9c7e-6a26036b2cf3',
    expertise: ['Image Processing', 'Video Processing', 'Mobile Applications', 'Internet of Things'],
    areas: ['vision', 'software', 'iot'],
  },
  {
    id: '95460f0a-b190-4ee5-9e4a-83b6ed1f9bd2',
    expertise: ['Artificial Intelligence', 'Machine Learning and Deep Learning', 'Data Science and Data Analytics'],
    areas: ['ai', 'data'],
  },
  {
    id: 'eb391ee9-7d9e-4661-b7c5-5f6027e5f345',
    expertise: ['Descriptive Data Analytics', 'Diagnostic Data Analytics', 'Predictive Data Analytics', 'ETL/ELT Developer'],
    areas: ['data'],
  },
  {
    id: 'f2097dae-82e9-4c12-9e29-02056bc3c271',
    expertise: ['Bio Informatics', 'Data Mining and Machine Learning', 'Internet of Things'],
    areas: ['bio', 'ai', 'data', 'iot'],
  },
  {
    id: 'a616422f-fa28-4f56-97a8-13b999cab47b',
    expertise: ['เทคโนโลยีการศึกษา การเรียนการสอนและการเรียนรู้ในศตวรรษที่ 21', 'เทคโนโลยีสารสนเทศด้านการเกษตร ฟาร์มอัจฉริยะ', 'การสื่อสารข้อมูลและเครือข่ายคอมพิวเตอร์ ระบบเครือข่ายขนาดใหญ่', 'ระบบรักษาความปลอดภัยข้อมูล (Information Security)', 'การพัฒนาซอฟต์แวร์และระบบฐานข้อมูล', 'การวิเคราะห์ข้อมูลสถิติเพื่อการวิจัย'],
    areas: ['edtech', 'network', 'software', 'database', 'data'],
  },
  {
    id: '8b00285b-45b4-49b7-80c2-474fd7cc5fd2',
    expertise: ['Thai Rhetorical Structure', 'Thai Computational Linguistic', 'Machine Learning / Deep Learning'],
    areas: ['nlp', 'ai'],
  },
  {
    id: '26128be3-ec32-485d-89ac-c3722dc666c9',
    expertise: ['Software and Application Development and Analysis', 'Database Management'],
    areas: ['software', 'database'],
  },
  {
    id: '1053e212-46a5-408f-ada3-f35cc60d418f',
    expertise: ['Data Structure', 'Database System', 'Block Chain Information System', 'Intelligence Algorithm for Optimization', 'Mobile Application'],
    areas: ['database', 'infosys', 'software'],
  },
];

const IDS = new Set(FACULTY_EXPERTISE.map((f) => f.id));

export function isFacultyId(id: unknown): id is string {
  return typeof id === 'string' && IDS.has(id);
}

/**
 * คำในแท็ก/หัวข้อกระทู้ → ด้านความถนัด (areas เดียวกับ frontend/src/data/faculty.ts → EXPERTISE_AREAS)
 * ใช้เลือกอาจารย์จากแท็กของกระทู้ — เทียบแบบตัวพิมพ์เล็ก และขอแค่มีคำนั้นอยู่ในแท็ก
 */
const AREA_KEYWORDS: ReadonlyArray<{ area: string; keywords: readonly string[] }> = [
  { area: 'database', keywords: ['database', 'sql', 'mongo', 'mysql', 'postgres', 'prisma', 'typeorm', 'ฐานข้อมูล'] },
  {
    area: 'software',
    keywords: ['program', 'java', 'nestjs', 'nest', 'react', 'next', 'node', 'javascript', 'typescript', 'python', 'web', 'api', 'app', 'flutter', 'android', 'ios', 'mobile', 'เว็บ', 'แอป', 'โปรแกรม'],
  },
  { area: 'ai', keywords: ['ai', 'machine', 'learning', 'deep', 'neural', 'model', 'llm', 'ปัญญาประดิษฐ์'] },
  { area: 'data', keywords: ['data', 'analytics', 'pandas', 'statistic', 'etl', 'big', 'ข้อมูล'] },
  { area: 'iot', keywords: ['iot', 'arduino', 'esp', 'sensor', 'raspberry', 'microcontroller', 'เซนเซอร์'] },
  { area: 'vision', keywords: ['image', 'vision', 'opencv', 'video', 'ภาพ'] },
  { area: 'nlp', keywords: ['nlp', 'language', 'text', 'chatbot', 'ภาษา'] },
  { area: 'network', keywords: ['network', 'security', 'cyber', 'linux', 'server', 'เครือข่าย', 'ความปลอดภัย'] },
  { area: 'infosys', keywords: ['mis', 'erp', 'information', 'system', 'สารสนเทศ'] },
  { area: 'bio', keywords: ['bio', 'genome', 'dna', 'ชีว'] },
  { area: 'edtech', keywords: ['edtech', 'education', 'agri', 'farm', 'เกษตร', 'การศึกษา'] },
];

/**
 * ด้านความถนัดที่แท็กเหล่านี้พูดถึง — คำอังกฤษเทียบทีละคำ (ขึ้นต้นด้วยคำสำคัญ) กัน "Thai" ถูกนับเป็น "ai"
 * คำไทยไม่มีช่องว่างคั่นคำ จึงเทียบแบบมีคำนั้นอยู่ในแท็ก
 */
export function areasForTags(tags: readonly string[]): string[] {
  const lowered = tags.map((tag) => tag.toLowerCase());
  const words = lowered.flatMap((tag) => tag.split(/[^a-z0-9]+/).filter(Boolean));
  const matches = (keyword: string) =>
    /^[a-z0-9]+$/.test(keyword)
      ? words.some((word) => word.startsWith(keyword))
      : lowered.some((tag) => tag.includes(keyword));
  return AREA_KEYWORDS.filter(({ keywords }) => keywords.some(matches)).map(({ area }) => area);
}

/** อาจารย์ทุกคนที่ด้านความถนัดตรงกับแท็ก เรียงจากตรงมากไปน้อย (ไม่ตรงเลย = ไม่อยู่ในรายการ) */
export function facultyForTags(tags: readonly string[], limit = Infinity): FacultyExpertise[] {
  const areas = new Set(areasForTags(tags));
  if (areas.size === 0) {
    return [];
  }
  return FACULTY_EXPERTISE.map((f) => ({ f, score: f.areas.filter((a) => areas.has(a)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ f }) => f);
}

/** แนะนำได้ไม่เกินเท่านี้ต่อคำตอบ (ทั้งสาขามี 10 คน) */
export const MAX_RECOMMENDED = 6;

/**
 * อาจารย์ที่แนะนำในคำตอบ: คนที่ AI เลือกว่าตรงเนื้อหาก่อน (เฉพาะ id ในทำเนียบ) ตามด้วยทุกคนที่ตรงแท็ก
 * ไม่ซ้ำกัน · ไม่เกิน MAX_RECOMMENDED
 */
export function recommendedLecturers(aiIds: unknown, byTags: readonly FacultyExpertise[]): string[] {
  const picked = Array.isArray(aiIds) ? aiIds.filter(isFacultyId) : [];
  return [...new Set([...picked, ...byTags.map((f) => f.id)])].slice(0, MAX_RECOMMENDED);
}
