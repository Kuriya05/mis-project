import { FACULTY, type ExpertiseArea, type FacultyMember } from "@/data/faculty";

// อาจารย์จากแท็กของกระทู้ — กติกาเดียวกับ backend/src/assistant/faculty-expertise.ts (areasForTags)
// โหมดตัวอย่างใช้ไฟล์นี้แทน backend · แก้คำสำคัญที่นี่ต้องแก้ที่ backend ด้วย

const AREA_KEYWORDS: ReadonlyArray<{ area: ExpertiseArea; keywords: readonly string[] }> = [
  { area: "database", keywords: ["database", "sql", "mongo", "mysql", "postgres", "prisma", "typeorm", "ฐานข้อมูล"] },
  {
    area: "software",
    keywords: ["program", "java", "nestjs", "nest", "react", "next", "node", "javascript", "typescript", "python", "web", "api", "app", "flutter", "android", "ios", "mobile", "เว็บ", "แอป", "โปรแกรม"],
  },
  { area: "ai", keywords: ["ai", "machine", "learning", "deep", "neural", "model", "llm", "ปัญญาประดิษฐ์"] },
  { area: "data", keywords: ["data", "analytics", "pandas", "statistic", "etl", "big", "ข้อมูล"] },
  { area: "iot", keywords: ["iot", "arduino", "esp", "sensor", "raspberry", "microcontroller", "เซนเซอร์"] },
  { area: "vision", keywords: ["image", "vision", "opencv", "video", "ภาพ"] },
  { area: "nlp", keywords: ["nlp", "language", "text", "chatbot", "ภาษา"] },
  { area: "network", keywords: ["network", "security", "cyber", "linux", "server", "เครือข่าย", "ความปลอดภัย"] },
  { area: "infosys", keywords: ["mis", "erp", "information", "system", "สารสนเทศ"] },
  { area: "bio", keywords: ["bio", "genome", "dna", "ชีว"] },
  { area: "edtech", keywords: ["edtech", "education", "agri", "farm", "เกษตร", "การศึกษา"] },
];

/** ด้านความถนัดที่แท็กพูดถึง — คำอังกฤษเทียบทีละคำ กัน "Thai" ถูกนับเป็น "ai" · คำไทยเทียบแบบมีอยู่ในแท็ก */
export function areasForTags(tags: readonly string[]): ExpertiseArea[] {
  const lowered = tags.map((tag) => tag.toLowerCase());
  const words = lowered.flatMap((tag) => tag.split(/[^a-z0-9]+/).filter(Boolean));
  const matches = (keyword: string) =>
    /^[a-z0-9]+$/.test(keyword) ? words.some((w) => w.startsWith(keyword)) : lowered.some((t) => t.includes(keyword));
  return AREA_KEYWORDS.filter(({ keywords }) => keywords.some(matches)).map(({ area }) => area);
}

/** อาจารย์ทุกคนที่ด้านความถนัดตรงกับแท็ก เรียงจากตรงมากไปน้อย */
export function facultyForTags(tags: readonly string[], limit = Infinity): FacultyMember[] {
  const areas = new Set(areasForTags(tags));
  if (areas.size === 0) return [];
  return FACULTY.map((f) => ({ f, score: f.areas.filter((a) => areas.has(a)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ f }) => f);
}

/** แนะนำได้ไม่เกินเท่านี้ต่อคำตอบ — ตรงกับ backend (MAX_RECOMMENDED) */
export const MAX_RECOMMENDED = 6;

/** คนที่ AI เลือกว่าตรงเนื้อหาก่อน (เฉพาะ id ในทำเนียบ) ตามด้วยทุกคนที่ตรงแท็ก · ไม่ซ้ำ · ไม่เกิน MAX_RECOMMENDED */
export function recommendedLecturers(aiIds: unknown, byTags: readonly FacultyMember[]): string[] {
  const known = new Set(FACULTY.map((f) => f.id));
  const picked = Array.isArray(aiIds) ? aiIds.filter((id): id is string => typeof id === "string" && known.has(id)) : [];
  return [...new Set([...picked, ...byTags.map((f) => f.id)])].slice(0, MAX_RECOMMENDED);
}

/** แท็กของแต่ละด้านความถนัด — ปุ่ม "ถามเรื่องที่อาจารย์ถนัด" ใส่แท็กเหล่านี้ให้ (areasForTags แปลงกลับได้ด้านเดิม) */
export const AREA_TAGS: Readonly<Record<ExpertiseArea, string>> = {
  ai: "AI",
  data: "Data-Science",
  database: "Database",
  software: "Programming",
  infosys: "MIS",
  iot: "IoT",
  vision: "Image-Processing",
  nlp: "NLP",
  network: "Network",
  edtech: "EdTech",
  bio: "Bioinformatics",
};

/** กระทู้ที่แท็กตรงกับด้านความถนัดของอาจารย์ (อย่างน้อยหนึ่งด้าน) */
export function questionsForLecturer<T extends { tags: string[] }>(lecturer: FacultyMember, questions: readonly T[]): T[] {
  const areas = new Set<ExpertiseArea>(lecturer.areas);
  return questions.filter((q) => areasForTags(q.tags).some((area) => areas.has(area)));
}
