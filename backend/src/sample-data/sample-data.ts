import { CoreRole, PrismaClient, QuestionStatus } from '../../generated/prisma/client';

// user-002 / user-003 ตรงกับบัญชี dev ของ Core Hub (standards/fixtures/dev-accounts.json)
// ที่เหลือเป็นผู้ใช้สมมติสำหรับข้อมูลตัวอย่างเท่านั้น
// person_code สมมติทั้งหมด (รหัส 6599xxxxxx ไม่ใช่รหัสนักศึกษาจริง) · ไม่เก็บชื่อ (reference-data.md ข้อ 8)
const PROFILES = {
  teacher: { coreUserId: 'user-003', coreRole: CoreRole.LECTURER, personCode: 'sample.lecturer' },
  anon: { coreUserId: 'user-002', coreRole: CoreRole.STUDENT, personCode: '6599000002' },
  wannapa: { coreUserId: 'seed-student-wannapa', coreRole: CoreRole.STUDENT, personCode: '6599000011' },
  somchai: { coreUserId: 'seed-student-somchai', coreRole: CoreRole.STUDENT, personCode: '6599000012' },
  thanakorn: { coreUserId: 'seed-student-thanakorn', coreRole: CoreRole.STUDENT, personCode: '6599000013' },
  anan: { coreUserId: 'seed-student-anan', coreRole: CoreRole.STUDENT, personCode: '6599000014' },
} as const;
type ProfileKey = keyof typeof PROFILES;

type SeedComment = {
  id: string;
  author: ProfileKey;
  body: string;
  minutesAgo: number;
  isVerified?: boolean;
  voters?: ProfileKey[];
};

type SeedQuestion = {
  id: string;
  author: ProfileKey;
  title: string;
  body: string;
  tags: string[];
  minutesAgo: number;
  voters: ProfileKey[];
  comments: SeedComment[];
};

const QUESTIONS: SeedQuestion[] = [
  {
    id: '5eed0000-0000-4000-8000-000000000001',
    author: 'anon',
    title: 'รัน MongoDB ไม่ขึ้นครับ Error connection refused',
    body: "พยายามรันโปรเจกต์แล้วขึ้น Error connection refused ยิงไป port 27017 ไม่ได้เลยครับ ต้องแก้ไขยังไงครับ โค้ดเชื่อมต่อประมาณนี้ครับ:\n\n```javascript\nmongoose.connect('mongodb://localhost:27017/my_db')\n  .then(() => console.log('Connected!'));\n```",
    tags: ['Database', 'Error'],
    minutesAgo: 10,
    voters: ['wannapa', 'somchai', 'thanakorn', 'anan'],
    comments: [
      {
        id: '5eed0000-0000-4000-8000-000000000101',
        author: 'teacher',
        body: 'ลองเช็คดูว่า mongod service รันอยู่หรือยังครับ ใน Windows ให้เปิดโปรแกรม Services (ค้นหาใน Start) แล้วมองหาบริการชื่อ `MongoDB Server (MongoDB)` จากนั้นกด Start service ครับ\n\nหรือถ้าใช้ command line ลองรันคำสั่ง `net start MongoDB` ใน Administrator PowerShell ดูครับ',
        minutesAgo: 8,
        voters: ['anon', 'wannapa', 'somchai', 'anan'],
      },
      {
        id: '5eed0000-0000-4000-8000-000000000102',
        author: 'anon',
        body: 'ขอบคุณครับอาจารย์ ลองเปิดใน Services แล้วเจอว่าปิดอยู่จริงๆ ด้วยครับ พอกด Start แล้วเชื่อมต่อได้ทันทีเลยครับ!',
        minutesAgo: 5,
        voters: ['teacher'],
      },
    ],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000002',
    author: 'wannapa',
    title: 'สอบถามวิธีใช้ useEffect ใน React เบื้องต้นครับ',
    body: 'อยากทราบว่า Dependency Array ใน useEffect ทำหน้าที่อะไร และมีวิธีกำหนดค่าอย่างไรบ้างครับ เช่น `[]` กับการไม่ใส่เลย หรือใส่ตัวแปรลงไป ต่างกันอย่างไรครับ',
    tags: ['React'],
    minutesAgo: 120,
    voters: ['anon', 'somchai', 'thanakorn', 'anan', 'teacher'],
    comments: [
      {
        id: '5eed0000-0000-4000-8000-000000000201',
        author: 'teacher',
        body: 'useEffect ใน React ใช้สำหรับจัดการ Side Effects ครับ โดยการทำงานขึ้นกับ Dependency Array (อาร์กิวเมนต์ตัวที่สอง):\n\n1. **ไม่ใส่ Dependency Array** (`useEffect(() => {})`):\n  ฟังก์ชันจะรันใหม่ทุกๆ ครั้งที่มีการเรนเดอร์ (Render) ใหม่ของ Component (ไม่แนะนำสำหรับดึงข้อมูลหรือ event listener เพราะเปลืองทรัพยากรมาก)\n\n2. **ใส่เป็น Array ว่าง** (`useEffect(() => {}, [])`):\n  ฟังก์ชันจะรัน**เฉพาะตอนที่ Component โหลดครั้งแรกเท่านั้น (Mount)** และไม่รันซ้ำอีก เหมาะสำหรับการ Fetch API หรือโหลดข้อมูลตั้งต้น\n\n3. **ใส่ตัวแปรใน Array** (`useEffect(() => {}, [count])`):\n  ฟังก์ชันจะรันตอนโหลดครั้งแรก และ**ทุกครั้งที่ค่าของตัวแปรใน Array เปลี่ยนแปลง**ครับ',
        minutesAgo: 110,
        isVerified: true,
        voters: ['wannapa', 'somchai', 'thanakorn', 'anan', 'anon'],
      },
      {
        id: '5eed0000-0000-4000-8000-000000000202',
        author: 'somchai',
        body: 'เข้าใจแจ่มแจ้งเลยครับอาจารย์ ขอบคุณมากๆ ครับ',
        minutesAgo: 100,
        voters: ['wannapa', 'teacher'],
      },
    ],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000003',
    author: 'thanakorn',
    title: 'จะเชื่อมต่อ NestJS กับ TypeORM ยังไงให้รองรับ ConfigService ครับ',
    body: 'ตอนแรกเขียน Config แบบ Hardcode ใน `TypeOrmModule.forRoot()` แล้วใช้งานได้ปกติครับ แต่พอจะเปลี่ยนมาดึงค่าจาก `.env` ผ่าน `ConfigService` ของ `@nestjs/config` แล้วมันฟ้องหา module ไม่เจอบ้าง หรือดึง config ได้เป็น undefined บ้าง รบกวนชี้แนะแนวทางหน่อยครับ',
    tags: ['NestJS', 'Database'],
    minutesAgo: 4 * 60,
    voters: ['anon', 'wannapa', 'somchai'],
    comments: [
      {
        id: '5eed0000-0000-4000-8000-000000000301',
        author: 'teacher',
        body: "แนะนำให้ใช้ `TypeOrmModule.forRootAsync` ร่วมกับ `ConfigModule` ในการโหลดแบบ Asynchronous ครับ โค้ดควรเขียนลักษณะนี้ครับ:\n\n```typescript\nTypeOrmModule.forRootAsync({\n  imports: [ConfigModule],\n  inject: [ConfigService],\n  useFactory: (configService: ConfigService) => ({\n    type: 'postgres',\n    host: configService.get<string>('DATABASE_HOST'),\n    port: configService.get<number>('DATABASE_PORT'),\n    username: configService.get<string>('DATABASE_USER'),\n    password: configService.get<string>('DATABASE_PASSWORD'),\n    database: configService.get<string>('DATABASE_NAME'),\n    entities: [__dirname + '/**/*.entity{.ts,.js}'],\n    synchronize: true,\n  }),\n})\n```\nอย่าลืมนำเข้า `ConfigModule.forRoot({ isGlobal: true })` ใน `AppModule` หลักด้วยนะครับ เพื่อให้เรียกใช้ได้ทุกที่",
        minutesAgo: 3.5 * 60,
        voters: ['thanakorn', 'anon', 'wannapa'],
      },
    ],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000004',
    author: 'anan',
    title: 'เขียนโปรแกรม Java หาเลขคู่คี่ทำไมรันแล้วติด IndexOutOfBoundsException ครับ',
    body: 'โค้ดรับอินพุตตัวเลขเข้ามาในอาร์เรย์แล้วกรองเลขคู่คี่ครับ แต่พอรันแล้วมีข้อผิดพลาดตลอดเลยครับ:\n\n```java\nint[] numbers = new int[5];\nfor (int i = 0; i <= numbers.length; i++) {\n    numbers[i] = scanner.nextInt();\n}\n```\nบรรทัดที่วนลูปในโค้ดนี้ผิดตรงไหนเหรอครับ?',
    tags: ['Java', 'Error'],
    minutesAgo: 24 * 60,
    voters: ['somchai'],
    comments: [],
  },
  {
    id: '5eed0000-0000-4000-8000-000000000005',
    author: 'somchai',
    title: 'สอบถามรายละเอียดโครงสร้างหลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ (ปรับปรุง 2570 / รหัส 70) ครับ',
    body: 'อยากทราบว่าหลักสูตรใหม่รหัส 70 มีโครงสร้างหน่วยกิตอย่างไรบ้าง และมีสายวิชาเลือก (Tracks) ให้เลือกเรียนอะไรบ้างครับ มีเปิดสอนวิชาทางด้าน AI หรือ Cloud บ้างไหมครับ?',
    tags: ['Curriculum', 'General'],
    minutesAgo: 3 * 24 * 60,
    voters: ['anon', 'wannapa', 'thanakorn', 'anan'],
    comments: [
      {
        id: '5eed0000-0000-4000-8000-000000000501',
        author: 'teacher',
        body: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2570 / รหัส 70) รวมตลอดหลักสูตรไม่น้อยกว่า 120–124 หน่วยกิตครับ โดยแบ่งเป็น:\n\n1. หมวดวิชาศึกษาทั่วไป (24–30 หน่วยกิต)\n2. หมวดวิชาเฉพาะ (84–90 หน่วยกิต) ประกอบด้วย วิชาแกน (12–15 นก.), วิชาเอกบังคับ (42–45 นก.), วิชาเอกเลือกตามแทร็ก (18–24 นก.) และสหกิจศึกษา CWIE (6–7 นก.)\n3. หมวดวิชาเลือกเสรี (ไม่น้อยกว่า 6 หน่วยกิต)\n\nนอกจากนี้ยังมี 4 Tracks สายอาชีพให้นักศึกษาเลือกตามความสนใจ ได้แก่:\n• Track 1: AI & Applied Data Intelligence\n• Track 2: Full-Stack Software & Cloud Architecture\n• Track 3: Cybersecurity & Defensive Operations\n• Track 4: Smart Technology & Agro-Informatics (อัตลักษณ์แม่โจ้)',
        minutesAgo: 2.5 * 24 * 60,
        isVerified: true,
        voters: ['somchai', 'anon', 'wannapa', 'thanakorn', 'anan'],
      },
    ],
  },
];

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

/**
 * Re-creates the sample questions (fixed ids) and their authors. Questions
 * that real users wrote are never touched, so it is safe to run again.
 */
export async function loadSampleData(
  prisma: PrismaClient,
): Promise<{ questions: number; comments: number }> {
  const profileIds = {} as Record<ProfileKey, string>;
  for (const [key, p] of Object.entries(PROFILES) as [ProfileKey, (typeof PROFILES)[ProfileKey]][]) {
    const row = await prisma.profile.upsert({
      where: { coreUserId: p.coreUserId },
      update: { personCode: p.personCode, coreRole: p.coreRole },
      create: p,
    });
    profileIds[key] = row.id;
  }

  const tagNames = [...new Set(QUESTIONS.flatMap((q) => q.tags))];
  const tagIds: Record<string, string> = {};
  for (const name of tagNames) {
    const row = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    tagIds[name] = row.id;
  }

  // ลบเฉพาะกระทู้ตัวอย่าง (cascade ไปคำตอบ/โหวต/แท็ก) แล้วสร้างใหม่ — ข้อมูลผู้ใช้จริงไม่ถูกแตะ
  await prisma.$transaction(async (tx) => {
    await tx.question.deleteMany({ where: { id: { in: QUESTIONS.map((q) => q.id) } } });

    for (const q of QUESTIONS) {
      const hasVerified = q.comments.some((c) => c.isVerified);
      await tx.question.create({
        data: {
          id: q.id,
          authorId: profileIds[q.author],
          title: q.title,
          body: q.body,
          status: hasVerified ? QuestionStatus.RESOLVED : QuestionStatus.WAITING,
          createdAt: minutesAgo(q.minutesAgo),
          tags: { create: q.tags.map((name) => ({ tagId: tagIds[name] })) },
          votes: { create: q.voters.map((v) => ({ profileId: profileIds[v] })) },
          comments: {
            create: q.comments.map((c) => ({
              id: c.id,
              authorId: profileIds[c.author],
              body: c.body,
              isVerified: c.isVerified ?? false,
              createdAt: minutesAgo(c.minutesAgo),
              votes: { create: (c.voters ?? []).map((v) => ({ profileId: profileIds[v] })) },
            })),
          },
        },
      });
    }
  });

  return {
    questions: QUESTIONS.length,
    comments: QUESTIONS.reduce((sum, q) => sum + q.comments.length, 0),
  };
}

